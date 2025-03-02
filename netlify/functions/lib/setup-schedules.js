require("dotenv").config();
const { Client } = require("@upstash/qstash");
const UpstashScheduler = require("./upstash");
const { TIME_WINDOWS } = require("./posting-windows");

async function setup() {
  console.log("⏳ Setting up Upstash QStash schedules...");

  // Use the UpstashScheduler class for better error handling and consistent setup
  const scheduler = new UpstashScheduler();

  try {
    // Create all schedules based on the TIME_WINDOWS configuration
    const results = await scheduler.setupAllWindows(TIME_WINDOWS);

    // Print summary of created schedules
    console.log("\n📊 Schedule Setup Results:");
    console.log("---------------------------");

    let successCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.status === "success") {
        console.log(`✅ ${result.windowName} - Created (ID: ${result.id})`);
        successCount++;
      } else {
        console.log(`❌ ${result.windowName} - Failed: ${result.error}`);
        errorCount++;
      }
    }

    console.log("---------------------------");
    console.log(`📈 Summary: ${successCount} created, ${errorCount} failed`);
  } catch (error) {
    console.error("❌ Error setting up schedules:", error.message);
    process.exit(1);
  }
}

// List all existing schedules to verify current configuration
async function listSchedules() {
  console.log("📋 Listing existing schedules...");

  try {
    // Create basic client for listing (don't need the full scheduler)
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    const schedules = await client.schedules.list();

    if (schedules.length === 0) {
      console.log("No schedules found.");
      return;
    }

    console.log(`Found ${schedules.length} schedules:`);
    schedules.forEach((schedule) => {
      // Parse body to extract window name if available
      let windowName = "Unknown";
      try {
        const body = JSON.parse(schedule.body);
        windowName = body.payload?.windowName || "Unknown";
      } catch (e) {}

      console.log(`- ${schedule.scheduleId}: ${windowName} (${schedule.cron})`);
    });
  } catch (error) {
    console.error("Error listing schedules:", error.message);
  }
}

// Delete all existing schedules to start fresh
async function deleteAllSchedules() {
  console.log("🗑️ Deleting all existing schedules...");

  try {
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    const schedules = await client.schedules.list();

    if (schedules.length === 0) {
      console.log("No schedules to delete.");
      return;
    }

    console.log(`Found ${schedules.length} schedules to delete.`);

    for (const schedule of schedules) {
      await client.schedules.delete(schedule.scheduleId);
      console.log(`✅ Deleted schedule ${schedule.scheduleId}`);
    }

    console.log("All schedules deleted successfully.");
  } catch (error) {
    console.error("Error deleting schedules:", error.message);
  }
}

// Handle command line arguments
const command = process.argv[2] || "setup";

switch (command) {
  case "setup":
    setup();
    break;
  case "list":
    listSchedules();
    break;
  case "delete":
    deleteAllSchedules();
    break;
  case "reset":
    (async () => {
      await deleteAllSchedules();
      await setup();
    })();
    break;
  default:
    console.log(`
Usage: node setup-schedules.js [command]

Commands:
  setup   - Create all schedules defined in TIME_WINDOWS (default)
  list    - List all existing schedules
  delete  - Delete all existing schedules
  reset   - Delete all schedules and create new ones
`);
}
