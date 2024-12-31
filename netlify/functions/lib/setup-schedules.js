require("dotenv").config();
const UpstashScheduler = require("./upstash");
const { TIME_WINDOWS } = require("./posting-windows");

async function setup() {
  const scheduler = new UpstashScheduler();

  // Validate required environment variables
  if (!process.env.QSTASH_TOKEN || !process.env.NETLIFY_WEBHOOK_URL) {
    console.error("❌ Missing required environment variables (QSTASH_TOKEN or NETLIFY_WEBHOOK_URL).");
    process.exit(1);
  }

  console.log("⏳ Setting up schedules...");
  try {
    const results = await scheduler.setupAllWindows(TIME_WINDOWS);

    // Log detailed results
    console.log("✅ Schedule setup results:");
    results.forEach((result) => {
      if (result.status === "success") {
        console.log(`   - ✅ Window: ${result.windowName}, Schedule ID: ${result.id}`);
      } else {
        console.error(`   - ❌ Window: ${result.windowName}, Error: ${result.error}`);
      }
    });

    console.log("🎉 All schedules processed.");
  } catch (error) {
    console.error("❌ Failed to setup schedules:", error);
  }
}

setup();
