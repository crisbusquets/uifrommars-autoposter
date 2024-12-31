require("dotenv").config();
const UpstashScheduler = require("./upstash");
const { TIME_WINDOWS } = require("./posting-windows");

async function setup() {
  const scheduler = new UpstashScheduler();
  try {
    const results = await scheduler.setupAllWindows(TIME_WINDOWS);
    console.log("Schedule setup results:", results);
  } catch (error) {
    console.error("Failed to setup schedules:", error);
  }
}

setup();
