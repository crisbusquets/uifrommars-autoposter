const axios = require("axios");
const crypto = require("crypto");

class UpstashScheduler {
  constructor() {
    this.webhookUrl = process.env.NETLIFY_WEBHOOK_URL;
    this.upstashUrl = process.env.UPSTASH_API_URL;
    this.upstashToken = process.env.UPSTASH_TOKEN;
  }

  async createSchedule(windowName, cronExpression) {
    const payload = {
      cron: cronExpression,
      callback: this.webhookUrl,
      payload: { windowName },
      retry: {
        attempts: 3,
        backoff: {
          type: "exponential",
          factor: 2,
        },
      },
    };

    try {
      const response = await axios.post(this.upstashUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.upstashToken}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to create schedule for ${windowName}:`, error);
      throw error;
    }
  }

  async setupAllWindows(timeWindows) {
    const results = [];
    for (const [window, config] of Object.entries(timeWindows)) {
      try {
        const result = await this.createSchedule(window, config.cron);
        results.push({ window, status: "success", id: result.id });
      } catch (error) {
        results.push({ window, status: "error", error: error.message });
      }
    }
    return results;
  }

  verifySignature(signature, body) {
    const expectedSignature = crypto.createHmac("sha256", process.env.UPSTASH_SIGNING_KEY).update(body).digest("hex");

    return signature === expectedSignature;
  }
}

module.exports = UpstashScheduler;
