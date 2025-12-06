const fs = require('fs');
const path = require('path');
const { Mutex } = require('async-mutex');

const settingsFilePath = path.join(process.cwd(), 'data', 'queue_settings.json');
const settingsLock = new Mutex();

// In-memory state
let settings = {
  skillsCutoffTime: "12:00 PM",
  skillsTurnoverTime: 5,
  skillsQueueManuallyOpen: false,
  skillsQueueClosed: false,
  numberOfFields: 4
};

const initializeSettingsFromFile = () => {
  console.log('[QueueSettings] Initializing from file:', settingsFilePath);
  try {
    if (fs.existsSync(settingsFilePath)) {
      console.log('[QueueSettings] File exists, reading...');
      const fileData = fs.readFileSync(settingsFilePath, 'utf-8');
      if (fileData) {
        const data = JSON.parse(fileData);
        settings = { ...settings, ...data };
        console.log('[QueueSettings] Loaded settings:', settings);
      }
    } else {
      console.log('[QueueSettings] File does not exist, creating with defaults');
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    }
  } catch (error) {
    console.error('[QueueSettings] Error initializing:', error);
  }
};

const updateSettingsFile = () => {
  console.log('[QueueSettings] Writing to file:', settings);
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), { flag: 'w' });
  console.log('[QueueSettings] File write complete');
};

const getSettings = () => {
  return settings;
};

const updateSettings = (newSettings) => {
  settings = { ...settings, ...newSettings };
  updateSettingsFile();
};

module.exports = {
  initializeSettingsFromFile,
  updateSettingsFile,
  getSettings,
  updateSettings,
  settingsLock
};
