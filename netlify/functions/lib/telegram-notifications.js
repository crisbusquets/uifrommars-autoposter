const axios = require("axios");

// Import formatDisplayTime from the main index file
const { formatDisplayTime } = require("../autoposter/index");

class TelegramNotifier {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(text) {
    if (!this.botToken || !this.chatId) {
      console.log("Telegram notifications not configured");
      return;
    }

    try {
      await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  }

  formatPost(post, message, results) {
    const platforms = [];

    // Check Twitter success
    if (results.twitter?.data?.id) {
      platforms.push("𝕏 Twitter");
    }

    // Check LinkedIn success
    if (results.linkedin && !results.linkedin.error) {
      platforms.push("💼 LinkedIn");
    }

    const timestamp = formatDisplayTime(new Date());

    return `🚀 <b>New post published!</b>

📝 <b>Message:</b>
${message}

🔗 <b>Blog post:</b>
${post.url}

📢 <b>Platforms:</b> ${platforms.join(", ")}

🕐 <b>Posted at:</b> ${timestamp}

#uiFromMars #AutoPoster`;
  }

  formatError(error) {
    const timestamp = new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      hour12: false,
    });

    return `❌ <b>Posting Error</b>

⚠️ <b>Error message:</b>
${error.message}

🕐 <b>Time:</b> ${timestamp}

#uiFromMarsError`;
  }

  formatSkip(reason, details = "") {
    const timestamp = formatDisplayTime(new Date());

    let message = `⭐️ <b>Post skipped</b>\n\n`;

    switch (reason) {
      case "window":
        message += `Not in valid posting window timeframe.`;
        break;
      case "no-posts":
        message += `No eligible posts found - all posts are too recent (30-day buffer).`;
        break;
      case "no-window":
        message += `No posting window specified in request.`;
        break;
      case "signature":
        message += `Invalid QStash signature received.`;
        break;
      default:
        message += reason; // Custom reason if provided
    }

    if (details) {
      message += `\n\nℹ️ <b>Details:</b>\n${details}`;
    }

    message += `\n\n🕐 <b>Time:</b> ${timestamp}\n\n#uiFromMarsStatus`;

    return message;
  }
}

// Export only the class
module.exports = TelegramNotifier;
