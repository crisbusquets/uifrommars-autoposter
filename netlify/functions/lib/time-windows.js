const TIME_WINDOWS = {
  EUROPEAN_MORNING: {
    start: { hour: 7, minute: 45 }, // 8:45 CET -> 7:45 UTC
    end: { hour: 8, minute: 15 }, // 9:15 CET -> 8:15 UTC
    region: "EU",
    probability: 0.35,
  },
  EUROPEAN_NOON: {
    start: { hour: 12, minute: 27 }, // 13:27 CET -> 12:27 UTC
    end: { hour: 12, minute: 57 }, // 13:57 CET -> 12:57 UTC
    region: "EU",
    probability: 0.35,
  },
  EUROPEAN_EVENING: {
    start: { hour: 17, minute: 0 }, // 18:00 CET -> 17:00 UTC
    end: { hour: 17, minute: 45 }, // 18:45 CET -> 17:45 UTC
    region: "EU",
    probability: 0.25,
  },
  LATAM_EVENING: {
    start: { hour: 22, minute: 0 }, // 23:00 CET -> 22:00 UTC
    end: { hour: 22, minute: 30 }, // 23:30 CET -> 22:30 UTC
    region: "LATAM",
    probability: 0.35,
  },
  LATAM_NIGHT: {
    start: { hour: 0, minute: 0 }, // 1:00 CET -> 0:00 UTC
    end: { hour: 0, minute: 30 }, // 1:30 CET -> 0:30 UTC
    region: "LATAM",
    probability: 0.35,
  },
};

// Function to format display time in specified timezone
function formatDisplayTime(date, timeZone = "Europe/Madrid") {
  return date.toLocaleString("es-ES", {
    timeZone,
    hour12: false,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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
  // Use UTC hours and minutes directly
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();

  for (const [windowName, window] of Object.entries(TIME_WINDOWS)) {
    if (hour === window.start.hour && hour === window.end.hour) {
      if (minute >= window.start.minute && minute <= window.end.minute) {
        return { inWindow: true, windowName, region: window.region, probability: window.probability };
      }
    } else if (hour === window.start.hour) {
      if (minute >= window.start.minute) {
        return { inWindow: true, windowName, region: window.region, probability: window.probability };
      }
    } else if (hour === window.end.hour) {
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
  formatDisplayTime,
};
