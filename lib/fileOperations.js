const fs = require('fs');
const path = require('path');
const { Mutex } = require('async-mutex');

const dbFilePath = path.join(process.cwd(), 'data', 'queue_data.json');
const writeLock = new Mutex();

// In-memory state
let nowServing = [];
let queue = [];

// Initialize from file
const initializeFromFile = () => {
  console.log('[FileOps] Initializing from file:', dbFilePath);
  try {
    if (fs.existsSync(dbFilePath)) {
      console.log('[FileOps] File exists, reading...');
      const fileData = fs.readFileSync(dbFilePath, 'utf-8');
      if (fileData) {
        const data = JSON.parse(fileData);
        if (data) {
          nowServing = data.nowServing || [];
          queue = data.queue || [];
          console.log('[FileOps] Loaded state - nowServing:', nowServing.length, 'queue:', queue.length);
        }
      }
    } else {
      console.log('[FileOps] File does not exist, creating empty file');
      // Create empty file if it doesn't exist
      fs.writeFileSync(
        dbFilePath,
        JSON.stringify({ nowServing: [], queue: [] }, null, 2)
      );
    }
  } catch (error) {
    console.error('[FileOps] Error initializing from file:', error);
    nowServing = [];
    queue = [];
  }
};

// Write to file
const updateFile = () => {
  console.log('[FileOps] Writing to file - nowServing:', nowServing.length, 'queue:', queue.length);
  fs.writeFileSync(
    dbFilePath,
    JSON.stringify({ nowServing, queue }, null, 2),
    { flag: 'w' }
  );
  console.log('[FileOps] File write complete');
};

// Get current state
const getState = () => {
  return { nowServing, queue };
};

// Set state (used by custom server)
const setState = (newNowServing, newQueue) => {
  nowServing = newNowServing;
  queue = newQueue;
};

module.exports = {
  initializeFromFile,
  updateFile,
  getState,
  setState,
  writeLock,
};
