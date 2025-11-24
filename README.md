# PYRS Queue Management System

A real-time queue management application built with Next.js for managing team queues, particularly designed for VEX Robotics competitions. The system provides a kiosk interface for teams to join the queue, an admin panel for managing the queue, and a public display showing the current queue status.

## Features

- **Kiosk Mode**: Teams can join the queue through a touch-friendly interface
- **Admin Panel**: Manage the queue, serve teams, remove teams, and move teams back in the queue
- **Real-time Updates**: WebSocket-based real-time synchronization across all connected clients
- **Queue Display**: Public display showing currently serving teams and the waiting queue
- **Team Integration**: Automatically fetches team data from VEX Tournament Manager
- **Persistent Storage**: Queue data is saved to a JSON file and persists across server restarts
- **Time Tracking**: Shows how long each team has been in service

## Tech Stack

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Radix UI Themes
- **Real-time Communication**: WebSocket (ws)
- **Data Persistence**: JSON file storage
- **Time Formatting**: react-time-ago, javascript-time-ago
- **HTTP Client**: Axios
- **HTML Parsing**: Cheerio

## Prerequisites

- Node.js 18+ and npm
- Access to VEX Tournament Manager (optional, for team data)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pyrs-app
```

2. Install dependencies:
```bash
npm install
```

3. Create the data directory (if it doesn't exist):
```bash
mkdir -p data
```

4. (Optional) Set environment variables:
```bash
# Set VEX Tournament Manager URL (defaults to http://10.0.0.3/division1/teams)
export VEX_TM_URL=http://your-vex-tm-url/division1/teams
```

## Usage

### Development Mode

Start the development server:
```bash
npm run dev
```

Or use the Windows batch file:
```bash
start.bat
```

The application will be available at:
- **Kiosk**: http://localhost:3000/queue/kiosk
- **Admin Panel**: http://localhost:3000/queue/admin
- **Queue Display**: http://localhost:3000/queue/current

### Production Mode

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Pages

### Kiosk (`/queue/kiosk`)
- Touch-friendly interface for teams to join the queue
- Shows all available teams from VEX Tournament Manager
- Disables teams that are already in the queue or being served
- Confirmation dialog before adding a team

### Admin Panel (`/queue/admin`)
- View teams currently being served with time elapsed
- View the waiting queue
- **Queue next team**: Move the first team from queue to "now serving"
- **Remove**: Remove a team from either the queue or "now serving"
- **Move back**: Move a team from "now serving" back to the queue (1 position or 5 positions)
- Keyboard shortcut: Press `Backspace` to queue the next team

### Queue Display (`/queue/current`)
- Public-facing display showing:
  - **Up Next**: Teams currently being served with time elapsed
  - **Current Queue**: List of teams waiting in the queue
- Visual flash effect when a new team is added to "now serving"
- Real-time updates via WebSocket

## API Endpoints

All API endpoints are handled by the custom server in `server.js`:

### `POST /api/add`
Add a team to the queue.

**Request Body:**
```json
{
  "team": "1234A"
}
```

**Response:**
- `200`: Team added successfully
- `400`: Team is already in queue

### `POST /api/serve`
Move the first team from the queue to "now serving".

**Response:**
- `200`: Team served successfully
- `400`: Queue is empty

### `POST /api/unserve`
Move a team from "now serving" back to the queue.

**Request Body:**
```json
{
  "team": "1234A",
  "amount": 1  // Optional: position to insert (default: 0)
}
```

**Response:**
- `200`: Team moved back successfully
- `400`: No teams in "now serving"

### `POST /api/remove`
Remove a team from both the queue and "now serving".

**Request Body:**
```json
{
  "team": "1234A"
}
```

**Response:**
- `200`: Team removed successfully

### `GET /api/teams`
Fetch team list from VEX Tournament Manager.

**Response:**
```json
[
  {
    "number": "1234A",
    "school": "Example High School"
  }
]
```

## WebSocket

The application uses WebSocket for real-time updates. All connected clients automatically receive updates when:
- A team is added to the queue
- A team is served
- A team is removed
- A team is moved back in the queue

**WebSocket Endpoint**: `ws://localhost:3000/ws`

The WebSocket connection is managed by the `usePyrsAppData` hook, which provides:
- `nowServing`: Array of teams currently being served
- `queue`: Array of teams waiting in the queue
- `isConnected`: Boolean indicating WebSocket connection status

## Project Structure

```
pyrs-app/
├── data/
│   └── queue_data.json          # Persistent queue data storage
├── lib/
│   ├── fileOperations.js        # File I/O operations for queue data
│   └── usePyrsAppData.js        # React hook for WebSocket queue data
├── pages/
│   ├── _app.js                  # Next.js app wrapper with theme
│   ├── api/                     # API routes (handled by server.js)
│   └── queue/
│       ├── admin.js             # Admin panel page
│       ├── current.js          # Queue display page
│       ├── index.js            # Queue index page
│       └── kiosk.js            # Kiosk page
├── public/
│   └── assets/                 # Static assets (images)
├── styles/
│   └── globals.css             # Global styles
├── server.js                   # Custom Next.js server with WebSocket
├── package.json
└── README.md
```

## Data Format

Queue data is stored in `data/queue_data.json`:

```json
{
  "nowServing": [
    {
      "number": "1234A",
      "at": "2025-11-22T21:23:52.270Z"
    }
  ],
  "queue": [
    {
      "number": "5678B",
      "at": null
    }
  ]
}
```

## Development

### Key Components

- **Custom Server** (`server.js`): Handles HTTP requests, WebSocket connections, and API routes
- **File Operations** (`lib/fileOperations.js`): Manages queue data persistence with mutex locking
- **Queue Data Hook** (`lib/usePyrsAppData.js`): Singleton WebSocket connection shared across components
- **Pages**: React components for each view (kiosk, admin, display)

### Thread Safety

The application uses `async-mutex` to ensure thread-safe file operations when multiple requests modify the queue simultaneously.

### WebSocket Reconnection

The WebSocket client automatically reconnects with exponential backoff if the connection is lost, up to 10 attempts.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (`development` or `production`)
- `VEX_TM_URL`: VEX Tournament Manager URL (default: `http://10.0.0.3/division1/teams`)

## Troubleshooting

### WebSocket Connection Issues
- Ensure the server is running on the correct port
- Check firewall settings if accessing from a different machine
- Verify the WebSocket endpoint is accessible

### Team Data Not Loading
- Verify the `VEX_TM_URL` environment variable is set correctly
- Check network connectivity to the VEX Tournament Manager
- Review server logs for error messages

### Queue Data Not Persisting
- Ensure the `data/` directory exists and is writable
- Check file permissions on `data/queue_data.json`
- Review server logs for file operation errors

## License

Private project - All rights reserved

## Contributing

This is a private project. For questions or issues, please contact the project maintainer.

