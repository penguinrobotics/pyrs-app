const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const axios = require('axios');
const cheerio = require('cheerio');
const {
  initializeFromFile,
  updateFile,
  getState,
  setState,
  writeLock,
  initializeRefereeFromFile,
  updateRefereeFile,
  getRefereeState,
  setRefereeState
} = require('./lib/fileOperations');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize queue data from file
initializeFromFile();
// Initialize referee data from file
initializeRefereeFromFile();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      console.log(`[REQUEST] ${req.method} ${pathname}`);

      // Handle custom API routes
      if (pathname === '/api/add' && req.method === 'POST') {
        console.log('[API /api/add] Request received');
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          console.log('[API /api/add] Body received:', body);
          await writeLock.acquire();
          try {
            const { team } = JSON.parse(body);
            console.log('[API /api/add] Adding team:', team);
            const { nowServing, queue } = getState();

            if (
              queue.find((t) => t.number === team) ||
              nowServing.find((t) => t.number === team)
            ) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Team is already in queue' }));
            } else {
              queue.push({ number: team, at: null });
              setState(nowServing, queue);
              updateFile();
              global.broadcastQueueData();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ team }));
            }
          } finally {
            writeLock.release();
          }
        });
        return;
      }

      if (pathname === '/api/serve' && req.method === 'POST') {
        await writeLock.acquire();
        try {
          const { nowServing, queue } = getState();

          if (queue.length) {
            const next = queue.shift();
            nowServing.push({ ...next, at: next.at || new Date() });
            setState(nowServing, queue);
            updateFile();
            global.broadcastQueueData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ team: next }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'empty' }));
          }
        } finally {
          writeLock.release();
        }
        return;
      }

      if (pathname === '/api/unserve' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          await writeLock.acquire();
          try {
            const { team, amount } = JSON.parse(body);
            const { nowServing, queue } = getState();

            if (nowServing.length) {
              const unservedIndex = nowServing.findIndex((t) => t.number === team);
              const unserved = nowServing.find((t) => t.number === team);
              nowServing.splice(unservedIndex, 1);
              queue.splice(amount - 1 || 0, 0, unserved);
              setState(nowServing, queue);
              updateFile();
              global.broadcastQueueData();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ team: unserved.number }));
            } else {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'empty' }));
            }
          } finally {
            writeLock.release();
          }
        });
        return;
      }

      if (pathname === '/api/remove' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          await writeLock.acquire();
          try {
            const { team } = JSON.parse(body);
            let { nowServing, queue } = getState();

            nowServing = nowServing.filter((t) => t.number !== team);
            queue = queue.filter((t) => t.number !== team);
            setState(nowServing, queue);
            updateFile();
            global.broadcastQueueData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ team }));
          } finally {
            writeLock.release();
          }
        });
        return;
      }

      if (pathname === '/api/add_violation' && req.method === 'POST') {
        console.log('[API /api/add_violation] Request received');
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          console.log('[API /api/add_violation] Body received:', body);
          await writeLock.acquire();
          try {
            const { team, rule, severity } = JSON.parse(body);
            console.log('[API /api/add_violation] Adding violation:', { team, rule, severity });
            const { violations } = getRefereeState();

            violations.push({ number: team, ruleId: rule, severity: severity });
            setRefereeState(violations);
            updateRefereeFile();
            global.broadcastQueueData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ team, rule, severity }));
          } catch (error) {
            console.error('[API /api/add_violation] Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to add violation' }));
          } finally {
            writeLock.release();
          }
        });
        return;
      }

      if (pathname === '/api/remove_violation' && req.method === 'POST') {
        console.log('[API /api/remove_violation] Request received');
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          console.log('[API /api/remove_violation] Body received:', body);
          await writeLock.acquire();
          try {
            const { team, rule, severity } = JSON.parse(body);
            console.log('[API /api/remove_violation] Removing violation:', { team, rule, severity });
            const { violations } = getRefereeState();

            // Find first instance of violation that matches team, rule and severity
            let found = false;
            for (let i = 0; i < violations.length; i++) {
              if (violations[i].number === team && violations[i].ruleId === rule && violations[i].severity === severity) {
                violations.splice(i, 1);
                found = true;
                console.log('[API /api/remove_violation] Violation removed');
                break;
              }
            }

            if (found) {
              setRefereeState(violations);
              updateRefereeFile();
              global.broadcastQueueData();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ team, rule, severity }));
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Violation not found' }));
            }
          } catch (error) {
            console.error('[API /api/remove_violation] Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to remove violation' }));
          } finally {
            writeLock.release();
          }
        });
        return;
      }

      if (pathname === '/api/teams' && req.method === 'GET') {
        try {
          const vexTmUrl = process.env.VEX_TM_URL || 'http://10.0.0.3/division1/teams';
          const html = await axios.get(vexTmUrl);
          const $ = cheerio.load(html.data);

          const teamData = [];
          $('tbody tr').each((index, element) => {
            const $tds = $(element).find('td');
            const number = $tds.eq(0).text().trim();
            const organization = $tds.eq(3).text().trim();
            teamData.push({ number, organization });
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(teamData));
        } catch (error) {
          console.error('Error fetching teams:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch teams' }));
        }
        return;
      }

      // Let Next.js handle all other routes
      console.log('[NEXT.JS] Passing to Next.js handler:', pathname);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('[ERROR] Error occurred handling', req.url);
      console.error('[ERROR]', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('internal server error');
      }
    }
  });

  // WebSocket server setup
  const wss = new WebSocket.Server({
    server,
    path: '/ws'
  });

  // Broadcast queue data to all connected clients
  function broadcastQueueData() {
    const { nowServing, queue } = getState();
    const { violations } = getRefereeState();
    const data = JSON.stringify({ nowServing, queue, violations });

    let sentCount = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Broadcasted to ${sentCount} client(s)`);
  }

  // Handle new WebSocket connections
  wss.on('connection', (ws) => {
    console.log('[WebSocket] New client connected. Total clients:', wss.clients.size);

    // Send initial data immediately
    const { nowServing, queue } = getState();
    const { violations } = getRefereeState();
    ws.send(JSON.stringify({ nowServing, queue, violations }));

    // Setup heartbeat to detect broken connections
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error.message);
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected. Remaining clients:', wss.clients.size);
    });
  });

  // Heartbeat interval to detect and close broken connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating inactive connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Expose broadcast function globally for API routes
  global.broadcastQueueData = broadcastQueueData;

  server.listen(port, (err) => {
    if (err) throw err;
    console.log('========================================');
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> WebSocket endpoint: ws://${hostname}:${port}/ws');
    console.log('> Pages:');
    console.log('  - http://' + hostname + ':' + port + '/queue/admin');
    console.log('  - http://' + hostname + ':' + port + '/queue/current');
    console.log('  - http://' + hostname + ':' + port + '/queue/kiosk');
    console.log('  - http://' + hostname + ':' + port + '/referee');
    console.log('========================================');
  });
});
