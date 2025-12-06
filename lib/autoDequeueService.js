const { scrapeSkillsData } = require('./skillsScraper');
const { bulkUpdateSkills, markFetchFailed, getSkillsState } = require('./skillsTracker');
const { getState, setState, updateFile, writeLock } = require('./fileOperations');

// Service state
let pollingInterval = null;
let monitoringInterval = null;
let isPollingActive = false;
let pollCount = 0;
let config = {
  baseUrl: null,
  pollIntervalMs: 5000,
  offlineMode: false
};

/**
 * Initialize auto-dequeue service with configuration
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - VEX TM base URL
 * @param {number} options.pollIntervalMs - Polling interval in milliseconds (default: 5000)
 * @param {boolean} options.offlineMode - Whether offline mode is enabled
 */
function initAutoDequeue(options) {
  config = {
    baseUrl: options.baseUrl,
    pollIntervalMs: options.pollIntervalMs || 5000,
    offlineMode: options.offlineMode || false
  };

  if (config.offlineMode) {
    console.log('[Auto-Dequeue] OFFLINE MODE - Service disabled');
    return;
  }

  if (!config.baseUrl) {
    console.error('[Auto-Dequeue] No base URL provided - Service disabled');
    return;
  }

  console.log('[Auto-Dequeue] Initialized with config:', {
    baseUrl: config.baseUrl,
    pollIntervalMs: config.pollIntervalMs,
    offlineMode: config.offlineMode
  });

  // Start monitoring queue state
  startMonitoring();
}

/**
 * Start monitoring queue state to enable/disable polling
 */
function startMonitoring() {
  // Check every second if we should be polling
  monitoringInterval = setInterval(() => {
    const { nowServing } = getState();
    const shouldPoll = nowServing.length > 0;

    if (shouldPoll && !isPollingActive) {
      startPolling();
    } else if (!shouldPoll && isPollingActive) {
      stopPolling();
    }
  }, 1000);

  console.log('[Auto-Dequeue] Monitoring started');
}

/**
 * Start polling for skills updates
 */
function startPolling() {
  if (config.offlineMode) {
    return;
  }

  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  isPollingActive = true;
  pollCount = 0;

  console.log('[Auto-Dequeue] Polling STARTED (interval:', config.pollIntervalMs, 'ms)');

  // Poll immediately, then on interval
  pollSkillsData();

  pollingInterval = setInterval(() => {
    pollSkillsData();
  }, config.pollIntervalMs);
}

/**
 * Stop polling for skills updates
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  isPollingActive = false;

  console.log('[Auto-Dequeue] Polling STOPPED (total polls:', pollCount, ')');
}

/**
 * Poll skills data and process changes
 */
async function pollSkillsData() {
  pollCount++;

  try {
    // Scrape current skills data
    const teamsData = await scrapeSkillsData(config.baseUrl);

    // Update tracker and get teams with increased attempts
    const changedTeams = bulkUpdateSkills(teamsData);

    if (changedTeams.length > 0) {
      console.log('[Auto-Dequeue] Detected', changedTeams.length, 'team(s) with increased attempts');

      // Process each changed team
      for (const { teamNumber, change } of changedTeams) {
        await dequeueTeam(teamNumber, change);
      }
    }

  } catch (error) {
    console.error('[Auto-Dequeue] Poll failed:', error.message);
    markFetchFailed();
  }
}

/**
 * Dequeue a team (remove from both nowServing and queue)
 * @param {string} teamNumber - Team number to remove
 * @param {Object} change - Change details for logging
 */
async function dequeueTeam(teamNumber, change) {
  await writeLock.acquire();

  try {
    let { nowServing, queue } = getState();

    // Check if team is in nowServing or queue
    const inNowServing = nowServing.find(t => t.number === teamNumber);
    const inQueue = queue.find(t => t.number === teamNumber);

    if (!inNowServing && !inQueue) {
      console.log('[Auto-Dequeue] Team', teamNumber, 'not in queue - skipping');
      return;
    }

    // Remove from both arrays
    nowServing = nowServing.filter(t => t.number !== teamNumber);
    queue = queue.filter(t => t.number !== teamNumber);

    // Update state and persist
    setState(nowServing, queue);
    updateFile();

    // Broadcast to all connected clients
    if (global.broadcastQueueData) {
      global.broadcastQueueData();
    }

    console.log('[Auto-Dequeue] Team', teamNumber, 'removed from queue');
    console.log('[Auto-Dequeue]   Reason:',
      change.autonomous ? `Autonomous: ${change.previous.autonomous} -> ${change.current.autonomous}` : '',
      change.driving ? `Driving: ${change.previous.driving} -> ${change.current.driving}` : ''
    );
    console.log('[Auto-Dequeue]   Was in nowServing:', !!inNowServing, '| Was in queue:', !!inQueue);

  } catch (error) {
    console.error('[Auto-Dequeue] Error dequeuing team', teamNumber, ':', error);
  } finally {
    writeLock.release();
  }
}

/**
 * Get service status
 * @returns {Object} Status information
 */
function getServiceStatus() {
  const skillsState = getSkillsState();

  return {
    enabled: !config.offlineMode && !!config.baseUrl,
    isPollingActive,
    pollCount,
    config: { ...config },
    skillsState: {
      teamsTracked: Object.keys(skillsState.teams).length,
      lastFetchTimestamp: skillsState.lastFetchTimestamp,
      lastFetchSuccess: skillsState.lastFetchSuccess
    }
  };
}

/**
 * Shutdown service
 */
function shutdown() {
  stopPolling();
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  console.log('[Auto-Dequeue] Service shutdown');
}

module.exports = {
  initAutoDequeue,
  getServiceStatus,
  shutdown
};
