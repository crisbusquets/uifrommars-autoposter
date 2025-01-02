const TIME_WINDOWS = {
  EUROPEAN_MORNING: {
    cron: "45 7 * * *",
    region: "EU",
  },
  EUROPEAN_NOON: {
    cron: "27 12 * * *",
    region: "EU",
  },
  EUROPEAN_EVENING: {
    cron: "0 17 * * *",
    region: "EU",
  },
  LATAM_EVENING: {
    cron: "0 22 * * *",
    region: "LATAM",
  },
  LATAM_NIGHT: {
    cron: "0 0 * * *",
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

// Always return true since we want to post 100% of the time
function shouldPostNow(windowName) {
  return TIME_WINDOWS[windowName] ? true : false;
}

module.exports = {
  TIME_WINDOWS,
  formatDisplayTime,
  shouldPostNow,
};
