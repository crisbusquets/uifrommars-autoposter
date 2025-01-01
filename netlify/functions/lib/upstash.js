const { Client } = require("@upstash/qstash");
const { Receiver } = require("@upstash/qstash");
const crypto = require("crypto");

class UpstashScheduler {
  constructor() {
    if (!process.env.QSTASH_TOKEN) {
      throw new Error("Missing QSTASH_TOKEN environment variable.");
    }
    if (!process.env.QSTASH_CURRENT_SIGNING_KEY) {
      throw new Error("Missing QSTASH_CURRENT_SIGNING_KEY environment variable.");
    }
    if (!process.env.QSTASH_NEXT_SIGNING_KEY) {
      throw new Error("Missing QSTASH_NEXT_SIGNING_KEY environment variable.");
    }

    this.client = new Client({ token: process.env.QSTASH_TOKEN });
    this.receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });
    this.webhookUrl = process.env.NETLIFY_WEBHOOK_URL;

    if (!this.webhookUrl) {
      throw new Error("Missing NETLIFY_WEBHOOK_URL environment variable.");
    }
  }

  async createSchedule(windowName, cronExpression, region, probability) {
    try {
      const response = await this.client.publish({
        url: this.webhookUrl,
        body: JSON.stringify({
          payload: {
            windowName,
            region,
            probability,
          },
        }),
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

  async setupAllWindows(windows) {
    const results = [];
    for (const [windowName, config] of Object.entries(windows)) {
      try {
        const result = await this.createSchedule(windowName, config.cron, config.region, config.probability);
        results.push({ windowName, status: "success", id: result.messageId });
      } catch (error) {
        results.push({ windowName, status: "error", error: error.message });
      }
    }
    return results;
  }

  async verifySignature(signature, body) {
    try {
      console.log("Verifying signature using QStash Receiver...");
      console.log("Signature:", signature);
      console.log("Body:", body);

      const isValid = await this.receiver.verify({
        signature: signature,
        body: body,
      });

      console.log("Signature verification result:", isValid);
      return isValid;
    } catch (error) {
      console.error("Error verifying signature:", error);
      return false;
    }
  }
}

module.exports = UpstashScheduler;
