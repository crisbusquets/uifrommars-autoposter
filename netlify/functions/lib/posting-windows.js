// posting-windows.js - Consolidated time window configuration
const TIME_WINDOWS = {
  // European time slots (Spain)
  EUROPEAN_MORNING: {
    cron: "15 9 * * *", // 9:15 AM Europe/Madrid
    region: "EU",
    probability: 1.0, // Always post
  },
  EUROPEAN_AFTERNOON: {
    cron: "37 13 * * *", // 1:37 PM Europe/Madrid
    region: "EU",
    probability: 1.0,
  },
  EUROPEAN_EVENING: {
    cron: "45 18 * * *", // 6:45 PM Europe/Madrid
    region: "EU",
    probability: 1.0,
  },

  // LATAM time slot (optimized for Mexico, Argentina, Colombia)
  LATAM_PRIME: {
    cron: "0 23 * * *", // 11:00 PM Europe/Madrid (5:00 PM Mexico/Colombia, 7:00 PM Argentina)
    region: "LATAM",
    probability: 1.0,
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

// With Upstash, we don't need to check time windows locally
// Instead, we just verify the window name exists in our config
function shouldPostNow(windowName) {
  return TIME_WINDOWS[windowName] ? true : false;
}

module.exports = {
  TIME_WINDOWS,
  formatDisplayTime,
  shouldPostNow,
};
