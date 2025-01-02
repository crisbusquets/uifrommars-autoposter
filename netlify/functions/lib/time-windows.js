const TIME_WINDOWS = {
  EUROPEAN_MORNING: {
    start: { hour: 7, minute: 45 },
    end: { hour: 8, minute: 15 },
    region: "EU",
  },
  EUROPEAN_NOON: {
    start: { hour: 12, minute: 27 },
    end: { hour: 12, minute: 57 },
    region: "EU",
  },
  EUROPEAN_EVENING: {
    start: { hour: 17, minute: 0 },
    end: { hour: 17, minute: 45 },
    region: "EU",
  },
  LATAM_EVENING: {
    start: { hour: 22, minute: 0 },
    end: { hour: 22, minute: 30 },
    region: "LATAM",
  },
  LATAM_NIGHT: {
    start: { hour: 0, minute: 0 },
    end: { hour: 0, minute: 30 },
    region: "LATAM",
  },
};

function formatDisplayTime(date) {
  return date.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    hour12: false,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const POSTS_PER_DAY = new Map();

function resetDailyCountsIfNeeded() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

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

function checkTimeWindow(date) {
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();

  for (const [windowName, window] of Object.entries(TIME_WINDOWS)) {
    if (hour === window.start.hour && hour === window.end.hour) {
      if (minute >= window.start.minute && minute <= window.end.minute) {
        return { inWindow: true, windowName, region: window.region };
      }
    } else if (hour === window.start.hour) {
      if (minute >= window.start.minute) {
        return { inWindow: true, windowName, region: window.region };
      }
    } else if (hour === window.end.hour) {
      if (minute <= window.end.minute) {
        return { inWindow: true, windowName, region: window.region };
      }
    }
  }

  return { inWindow: false };
}

function shouldPostNow() {
  const timeWindow = checkTimeWindow(new Date());
  return timeWindow.inWindow;
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
  checkTimeWindow,
  shouldPostNow,
  getPostingStats,
  TIME_WINDOWS,
  formatDisplayTime,
};
