const { Client } = require("@upstash/qstash");
const crypto = require("crypto");
const { TIME_WINDOWS } = require("./posting-windows");

class UpstashScheduler {
  constructor() {
    this.client = new Client({ token: process.env.QSTASH_TOKEN });
    this.webhookUrl = process.env.NETLIFY_WEBHOOK_URL;

    if (!this.webhookUrl) {
      throw new Error("Missing NETLIFY_WEBHOOK_URL environment variable.");
    }
    if (!process.env.QSTASH_TOKEN) {
      throw new Error("Missing QSTASH_TOKEN environment variable.");
    }
  }

  async createSchedule(windowName, cronExpression, region, probability) {
    try {
      const response = await this.client.publish({
        url: this.webhookUrl,
        body: JSON.stringify({ windowName, region, probability }),
        headers: { "Content-Type": "application/json" },
        cron: cronExpression,
        retries: 3,
        retryDelay: 5000,
      });

      console.log(`✅ Schedule created for ${windowName}: ${response.messageId}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to create schedule for ${windowName}:`, error.message);
      throw error;
    }
  }

  async setupAllWindows() {
    const results = [];
    for (const [windowName, config] of Object.entries(TIME_WINDOWS)) {
      try {
        const result = await this.createSchedule(windowName, config.cron, config.region, config.probability);
        results.push({ windowName, status: "success", id: result.messageId });
      } catch (error) {
        results.push({ windowName, status: "error", error: error.message });
      }
    }
    return results;
  }

  verifySignature(signature, body) {
    if (!process.env.QSTASH_CURRENT_SIGNING_KEY) {
      throw new Error("Missing QSTASH_CURRENT_SIGNING_KEY environment variable.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.QSTASH_CURRENT_SIGNING_KEY)
      .update(body)
      .digest("hex");

    return signature === expectedSignature;
  }
}

module.exports = UpstashScheduler;
