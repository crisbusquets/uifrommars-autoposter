// netlify/functions/lib/linkedin-token-monitor.js
const TelegramNotifier = require("./telegram-notifications");

class LinkedInTokenMonitor {
  constructor() {
    this.notifier = new TelegramNotifier();
  }

  async checkTokenExpiry() {
    if (process.env.ENABLE_LINKEDIN !== "true") {
      return true; // Skip if LinkedIn is disabled
    }

    try {
      const LinkedInClient = require("./linkedin");
      const client = new LinkedInClient();

      // Try to verify the token
      const isValid = await client.verifyToken();

      if (!isValid) {
        // Token is expired - send alert
        await this.notifier.sendMessage(`🚨 <b>LinkedIn Token EXPIRED!</b>

Your LinkedIn access token has expired. 

🔧 <b>To fix:</b>
1. Run: <code>node scripts/refresh-linkedin-token.js</code>
2. Follow the instructions
3. Update your .env file and Netlify environment variables

The autoposter will skip LinkedIn posts until fixed.

#LinkedInTokenExpired`);
        return false;
      }

      // Check if we're close to expiry (warn at 7 days)
      const tokenCreated = process.env.LINKEDIN_TOKEN_CREATED;
      if (tokenCreated) {
        const createdDate = new Date(tokenCreated);
        const now = new Date();
        const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = 60 - daysSinceCreated;

        if (daysRemaining <= 7 && daysRemaining > 0) {
          await this.notifier.sendMessage(`⚠️ <b>LinkedIn Token Expiring Soon!</b>

Your LinkedIn token expires in <b>${daysRemaining} days</b>.

🔧 <b>Renew it now:</b>
1. Run: <code>node scripts/refresh-linkedin-token.js</code>
2. Update .env and Netlify variables

#LinkedInTokenWarning`);
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking LinkedIn token:", error);
      return true; // Don't fail the whole process
    }
  }
}

module.exports = LinkedInTokenMonitor;
