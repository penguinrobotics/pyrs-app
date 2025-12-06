function parseTime(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

function calculateQueueStatus(settings, queueState, currentTime = new Date()) {
  const {
    skillsCutoffTime,
    skillsTurnoverTime,
    skillsQueueManuallyOpen,
    skillsQueueClosed
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

  // Parse cutoff time
  const cutoff = parseTime(skillsCutoffTime);
  if (!cutoff) {
    return { isOpen: true, reason: 'invalid_cutoff' };
  }

  // Calculate minutes until cutoff
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const cutoffMinutes = cutoff.hours * 60 + cutoff.minutes;
  const minutesRemaining = cutoffMinutes - currentMinutes;

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
  const totalCapacity = Math.floor(minutesRemaining / skillsTurnoverTime);
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

// Support both CommonJS (Node) and ES6 (browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateQueueStatus, parseTime };
}

// For ES6 imports (Next.js will handle this)
export { calculateQueueStatus, parseTime };
