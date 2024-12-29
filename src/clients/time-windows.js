// time-windows.js
const TIME_WINDOWS = {
  EUROPEAN_MORNING: {
    start: { hour: 8, minute: 45 },
    end: { hour: 9, minute: 15 },
    region: "EU",
    probability: 0.35, // 90% chance of posting in this window
  },
  EUROPEAN_NOON: {
    start: { hour: 13, minute: 27 },
    end: { hour: 13, minute: 57 },
    region: "EU",
    probability: 0.35,
  },
  EUROPEAN_EVENING: {
    start: { hour: 18, minute: 0 },
    end: { hour: 18, minute: 45 },
    region: "EU",
    probability: 0.25, // Lower per-check probability due to longer window
  },
  LATAM_EVENING: {
    start: { hour: 23, minute: 0 },
    end: { hour: 23, minute: 30 },
    region: "LATAM",
    probability: 0.35,
  },
  LATAM_NIGHT: {
    start: { hour: 1, minute: 0 },
    end: { hour: 1, minute: 30 },
    region: "LATAM",
    probability: 0.35,
  },
};

// Keep track of posts per window per day
const POSTS_PER_DAY = new Map();

function resetDailyCountsIfNeeded() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Reset if it's a new day
  if (!POSTS_PER_DAY.has(today)) {
    POSTS_PER_DAY.clear();
    POSTS_PER_DAY.set(today, {
      total: 0,
      windows: Object.keys(TIME_WINDOWS).reduce((acc, window) => {
        acc[window] = 0;
        return acc;
      }, {}),
    });
  }

  return POSTS_PER_DAY.get(today);
}

function isWithinTimeWindow(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();

  // Check if current time falls within any of the defined windows
  for (const [windowName, window] of Object.entries(TIME_WINDOWS)) {
    if (hour === window.start.hour && hour === window.end.hour) {
      // Within the same hour
      if (minute >= window.start.minute && minute <= window.end.minute) {
        return { inWindow: true, windowName, region: window.region, probability: window.probability };
      }
    } else if (hour === window.start.hour) {
      // At start hour
      if (minute >= window.start.minute) {
        return { inWindow: true, windowName, region: window.region, probability: window.probability };
      }
    } else if (hour === window.end.hour) {
      // At end hour
      if (minute <= window.end.minute) {
        return { inWindow: true, windowName, region: window.region, probability: window.probability };
      }
    }
  }

  return { inWindow: false };
}

function shouldPostNow() {
  const dailyCounts = resetDailyCountsIfNeeded();
  const timeWindow = isWithinTimeWindow(new Date());

  if (!timeWindow.inWindow) return false;

  // Don't post again if we've already posted in this window today
  if (dailyCounts.windows[timeWindow.windowName] > 0) return false;

  // Use the probability defined for this specific window
  const shouldPost = Math.random() < timeWindow.probability;

  if (shouldPost) {
    dailyCounts.total += 1;
    dailyCounts.windows[timeWindow.windowName] = 1;
  }

  return shouldPost;
}

function getPostingStats() {
  const dailyCounts = resetDailyCountsIfNeeded();
  return {
    ...dailyCounts,
    remainingWindows: Object.entries(TIME_WINDOWS)
      .filter(([windowName]) => !dailyCounts.windows[windowName])
      .map(([windowName]) => windowName),
  };
}

module.exports = {
  isWithinTimeWindow,
  shouldPostNow,
  getPostingStats,
  TIME_WINDOWS,
};
