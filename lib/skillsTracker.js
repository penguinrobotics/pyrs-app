/**
 * Skills attempt tracker for auto-dequeue functionality
 * Tracks autonomous and driving skills attempts for each team
 */

// In-memory state for skills attempts
let skillsState = {
  // Map of team number to their attempt counts
  // Example: { "502A": { autonomous: 0, driving: 2, lastUpdated: timestamp } }
  teams: {},
  lastFetchTimestamp: null,
  lastFetchSuccess: false
};

/**
 * Get current skills state
 * @returns {Object} Skills state object
 */
function getSkillsState() {
  return { ...skillsState };
}

/**
 * Update skills state for a specific team
 * @param {string} teamNumber - Team number
 * @param {number} autonomous - Autonomous attempts
 * @param {number} driving - Driving attempts
 * @returns {Object|null} Changes detected { autonomous: boolean, driving: boolean, either: boolean }
 */
function updateTeamSkills(teamNumber, autonomous, driving) {
  const previous = skillsState.teams[teamNumber];
  const now = Date.now();

  // Initialize if team doesn't exist
  if (!previous) {
    skillsState.teams[teamNumber] = {
      autonomous,
      driving,
      lastUpdated: now
    };
    return null; // No change on first initialization
  }

  // Check for changes
  const autonomousChanged = previous.autonomous < autonomous;
  const drivingChanged = previous.driving < driving;
  const anyChange = autonomousChanged || drivingChanged;

  // Update state
  if (anyChange) {
    skillsState.teams[teamNumber] = {
      autonomous,
      driving,
      lastUpdated: now
    };
  }

  return anyChange ? {
    autonomous: autonomousChanged,
    driving: drivingChanged,
    either: anyChange,
    previous: { autonomous: previous.autonomous, driving: previous.driving },
    current: { autonomous, driving }
  } : null;
}

/**
 * Bulk update all teams from scraped data
 * @param {Array} teamsData - Array of { number, autonomous, driving }
 * @returns {Array} Teams with increased attempts
 */
function bulkUpdateSkills(teamsData) {
  const changedTeams = [];
  const now = Date.now();

  teamsData.forEach(({ number, autonomous, driving }) => {
    const change = updateTeamSkills(number, autonomous, driving);
    if (change) {
      changedTeams.push({
        teamNumber: number,
        change
      });
    }
  });

  skillsState.lastFetchTimestamp = now;
  skillsState.lastFetchSuccess = true;

  return changedTeams;
}

/**
 * Mark fetch as failed
 */
function markFetchFailed() {
  skillsState.lastFetchSuccess = false;
  skillsState.lastFetchTimestamp = Date.now();
}

/**
 * Reset skills state (useful for testing or reinitialization)
 */
function resetSkillsState() {
  skillsState = {
    teams: {},
    lastFetchTimestamp: null,
    lastFetchSuccess: false
  };
}

module.exports = {
  getSkillsState,
  updateTeamSkills,
  bulkUpdateSkills,
  markFetchFailed,
  resetSkillsState
};
