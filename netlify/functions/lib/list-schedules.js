require("dotenv").config();
const { Client } = require("@upstash/qstash");

const client = new Client({ token: process.env.QSTASH_TOKEN });

const main = async () => {
  const result = await client.schedules.list();

  if (!result || !result.length) {
    console.log("🚫 No QStash schedules found.");
    return;
  }

  for (const schedule of result) {
    console.log("—".repeat(40));
    console.log(`🆔  ID: ${schedule.scheduleId}`);
    console.log(`🌐 URL: ${schedule.destination}`);
    console.log(`🕒 CRON: ${schedule.cron}`);
    console.log(`📅 Next Run: ${schedule.next}`);
    console.log(`📌 Status: ${schedule.enabled ? "Enabled" : "Disabled"}`);
  }
};

main().catch(console.error);
