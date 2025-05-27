// posting-windows.js - Consolidated time window configuration
const TIME_WINDOWS = {
  EU_MORNING: {
    start: "08:45",
    end: "09:35",
    timezone: "Europe/Madrid",
    cron: "45 6 * * *", // QStash fires at 08:45 Madrid = 06:45 UTC
    region: "EU",
    probability: 1,
  },
  EU_AFTERNOON: {
    start: "17:55",
    end: "19:05",
    timezone: "Europe/Madrid",
    cron: "55 15 * * *", // 17:55 Madrid = 15:55 UTC
    region: "EU",
    probability: 1,
  },
  LATAM_AFTERNOON: {
    start: "13:25",
    end: "15:05",
    timezone: "America/Mexico_City",
    cron: "25 19 * * *", // 13:25 CDMX = 19:25 UTC
    region: "LATAM",
    probability: 1,
  },
};

// With Upstash, we don't need to check time windows locally
// Instead, we just verify the window name exists in our config
function shouldPostNow(windowName) {
  return TIME_WINDOWS[windowName] ? true : false;
}

module.exports = {
  TIME_WINDOWS,
  shouldPostNow,
};
