const TIME_WINDOWS = {
  EUROPEAN_MORNING: {
    cron: "45 7 * * *",
    probability: 0.35,
    region: "EU",
  },
  EUROPEAN_NOON: {
    cron: "27 12 * * *",
    probability: 0.35,
    region: "EU",
  },
  EUROPEAN_EVENING: {
    cron: "0 17 * * *",
    probability: 0.25,
    region: "EU",
  },
  LATAM_EVENING: {
    cron: "0 22 * * *",
    probability: 0.35,
    region: "LATAM",
  },
  LATAM_NIGHT: {
    cron: "0 0 * * *",
    probability: 0.35,
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

function shouldPostNow(windowName) {
  const window = TIME_WINDOWS[windowName];
  return window ? Math.random() < window.probability : false;
}

module.exports = {
  TIME_WINDOWS,
  formatDisplayTime,
  shouldPostNow,
};
