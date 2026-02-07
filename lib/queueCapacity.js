function parseDateTime(dateTimeStr) {
  // Format: "MM/dd hh:mm a" or "MM/dd hha" (e.g., "2/6 12:00 PM" or "2/6 12pm")
  const match = dateTimeStr.match(/(\d{1,2})\/(\d{1,2})\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;

  const month = parseInt(match[1]);
  const day = parseInt(match[2]);
  let hours = parseInt(match[3]);
  const minutes = match[4] ? parseInt(match[4]) : 0;
  const period = match[5].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { month, day, hours, minutes };
}

function getCurrentLocalTime() {
  return new Date();
}

function calculateQueueStatus(settings, queueState, currentTime = null) {
  // Use local server time for all calculations
  const now = currentTime || getCurrentLocalTime();

  const {
    skillsCutoffTime,
    skillsTurnoverTime,
    skillsQueueManuallyOpen,
    skillsQueueClosed,
    numberOfFields
  } = settings;

  // Manual override takes precedence
  if (skillsQueueManuallyOpen) {
    return {
      isOpen: true,
      reason: 'manual',
      remainingSlots: Infinity
    };
  }

  // If already closed, stay closed
  if (skillsQueueClosed) {
    return {
      isOpen: false,
      reason: 'permanently_closed',
      remainingSlots: 0
    };
  }

  // Parse cutoff date/time (interpreted as local server time)
  const cutoff = parseDateTime(skillsCutoffTime);
  if (!cutoff) {
    return { isOpen: true, reason: 'invalid_cutoff' };
  }

  // Build cutoff date using current year (in local server time)
  const cutoffDate = new Date(
    now.getFullYear(),
    cutoff.month - 1,
    cutoff.day,
    cutoff.hours,
    cutoff.minutes
  );

  // Calculate minutes until cutoff
  const minutesRemaining = Math.floor((cutoffDate - now) / (1000 * 60));

  // If past cutoff, close permanently
  if (minutesRemaining <= 0) {
    return {
      isOpen: false,
      reason: 'past_cutoff',
      remainingSlots: 0,
      minutesRemaining: 0,
      shouldPermanentlyClose: true
    };
  }

  // Calculate capacity
  const totalCapacity = Math.floor((minutesRemaining / skillsTurnoverTime) * (numberOfFields || 1));
  const currentQueueSize = queueState.nowServing.length + queueState.queue.length;
  const remainingSlots = Math.max(0, totalCapacity - currentQueueSize);

  // If no capacity, close permanently
  if (remainingSlots <= 0) {
    return {
      isOpen: false,
      reason: 'capacity_full',
      remainingSlots: 0,
      totalCapacity,
      currentQueueSize,
      minutesRemaining,
      shouldPermanentlyClose: true
    };
  }

  return {
    isOpen: true,
    reason: 'capacity_available',
    remainingSlots,
    totalCapacity,
    currentQueueSize,
    minutesRemaining
  };
}

module.exports = { calculateQueueStatus, parseDateTime, getCurrentLocalTime };
