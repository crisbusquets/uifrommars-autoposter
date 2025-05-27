require("dotenv").config();
const { Client } = require("@upstash/qstash");

const client = new Client({ token: process.env.QSTASH_TOKEN });

// ✅ define only the schedules you want to keep
const KEEP = new Set(["autoposter-eu-morning", "autoposter-eu-afternoon", "autoposter-latam-morning"]);

const main = async () => {
  const schedules = await client.schedules.list();

  if (!schedules || schedules.length === 0) {
    console.log("No schedules found.");
    return;
  }

  const toDelete = schedules.filter((s) => !KEEP.has(s.scheduleId));

  if (toDelete.length === 0) {
    console.log("✅ No stale schedules to delete.");
    return;
  }

  console.log(`⚠️ Found ${toDelete.length} stale schedule(s):`);
  for (const s of toDelete) {
    console.log(`— ${s.scheduleId} (${s.cron})`);
  }

  const confirmation = await ask("Delete these? (yes/no): ");
  if (confirmation !== "yes") {
    console.log("❌ Aborted by user.");
    return;
  }

  for (const s of toDelete) {
    await client.schedules.delete(s.scheduleId);
    console.log(`✅ Deleted: ${s.scheduleId}`);
  }
};

function ask(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (data) => resolve(data.trim()));
  });
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
