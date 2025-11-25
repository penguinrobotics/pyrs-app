const fs = require('fs');
const path = require('path');
const { Mutex } = require('async-mutex');

const dbFilePath = path.join(process.cwd(), 'data', 'queue_data.json');
const refereeFilePath = path.join(process.cwd(), 'data', 'referee_data.json');
const judgingFilePath = path.join(process.cwd(), 'data', 'judging_schedule.json');
const writeLock = new Mutex();

// In-memory state
let nowServing = [];
let queue = [];
let violations = [];
let judgingSchedule = { metadata: null, schedule: [] };

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

// Initialize referee data from file
const initializeRefereeFromFile = () => {
  console.log('[FileOps] Initializing referee data from file:', refereeFilePath);
  try {
    if (fs.existsSync(refereeFilePath)) {
      console.log('[FileOps] Referee file exists, reading...');
      const fileData = fs.readFileSync(refereeFilePath, 'utf-8');
      if (fileData) {
        const data = JSON.parse(fileData);
        if (data) {
          violations = data.violations || [];
          console.log('[FileOps] Loaded referee state - violations:', violations.length);
        }
      }
    } else {
      console.log('[FileOps] Referee file does not exist, creating empty file');
      // Create empty file if it doesn't exist
      fs.writeFileSync(
        refereeFilePath,
        JSON.stringify({ violations: [] }, null, 2)
      );
    }
  } catch (error) {
    console.error('[FileOps] Error initializing referee data from file:', error);
    violations = [];
  }
};

// Write referee data to file
const updateRefereeFile = () => {
  // Sort violations by team number
  const sortedViolations = [...violations].sort((a, b) => {
    // Sort by team number
    const intA = parseInt(a.number);
    const intB = parseInt(b.number);
    if (intA < intB) {
      return -1;
    }
    if (intA > intB) {
      return 1;
    }
    return 0;
  });

  console.log('[FileOps] Writing referee data to file - violations:', sortedViolations.length);
  fs.writeFileSync(
    refereeFilePath,
    JSON.stringify({ violations: sortedViolations }, null, 2),
    { flag: 'w' }
  );
  console.log('[FileOps] Referee file write complete');
};

// Get current referee state
const getRefereeState = () => {
  return { violations };
};

// Set referee state
const setRefereeState = (newViolations) => {
  violations = newViolations;
};

// Initialize judging data from file
const initializeJudgingFromFile = () => {
  console.log('[FileOps] Initializing judging data from file:', judgingFilePath);
  try {
    if (fs.existsSync(judgingFilePath)) {
      console.log('[FileOps] Judging file exists, reading...');
      const fileData = fs.readFileSync(judgingFilePath, 'utf-8');
      if (fileData) {
        const data = JSON.parse(fileData);
        if (data) {
          judgingSchedule = data;
          console.log('[FileOps] Loaded judging state - schedule slots:', judgingSchedule.schedule.length);
        }
      }
    } else {
      console.log('[FileOps] Judging file does not exist, creating empty file');
      // Create empty file if it doesn't exist
      fs.writeFileSync(
        judgingFilePath,
        JSON.stringify({ metadata: null, schedule: [] }, null, 2)
      );
    }
  } catch (error) {
    console.error('[FileOps] Error initializing judging data from file:', error);
    judgingSchedule = { metadata: null, schedule: [] };
  }
};

// Write judging data to file
const updateJudgingFile = () => {
  console.log('[FileOps] Writing judging data to file - schedule slots:', judgingSchedule.schedule.length);
  fs.writeFileSync(
    judgingFilePath,
    JSON.stringify(judgingSchedule, null, 2),
    { flag: 'w' }
  );
  console.log('[FileOps] Judging file write complete');
};

// Get current judging state
const getJudgingState = () => {
  return judgingSchedule;
};

// Set judging state
const setJudgingState = (newSchedule) => {
  judgingSchedule = newSchedule;
};

module.exports = {
  initializeFromFile,
  updateFile,
  getState,
  setState,
  writeLock,
  initializeRefereeFromFile,
  updateRefereeFile,
  getRefereeState,
  setRefereeState,
  initializeJudgingFromFile,
  updateJudgingFile,
  getJudgingState,
  setJudgingState,
};
