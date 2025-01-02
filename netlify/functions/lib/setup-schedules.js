require("dotenv").config();
const { Client } = require("@upstash/qstash");
const { TIME_WINDOWS } = require("./posting-windows");

const scheduler = new Client({
  token: process.env.QSTASH_TOKEN,
});

async function setup() {
  console.log("⏳ Setting up schedules...");

  for (const [windowName, config] of Object.entries(TIME_WINDOWS)) {
    try {
      const response = await scheduler.schedules.create({
        destination: process.env.NETLIFY_WEBHOOK_URL,
        cron: config.cron,
        body: JSON.stringify({
          payload: {
            windowName,
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        retries: 3,
      });

      console.log(`✅ Created schedule for ${windowName}:`, response.scheduleId);
    } catch (error) {
      console.error(`❌ Failed for ${windowName}:`, error.message);
    }
  }
}

setup();
