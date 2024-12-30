const axios = require("axios");

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
    // More robust platform detection
    const platforms = [];
    if (results.twitter && !results.twitter.error) {
      platforms.push("𝕏 Twitter");
    }
    if (results.linkedin && !results.linkedin.error) {
      platforms.push("💼 LinkedIn");
    }

    // Use the new formatDisplayTime function from time-windows.js
    const timestamp = formatDisplayTime(new Date());

    return `🚀 <b>New post published!</b>

📝 <b>Message:</b>
${message}

🔗 <b>Blog post:</b>
${post.url}

📢 <b>Platforms:</b> ${platforms.join(", ")}

🕒 <b>Posted at:</b> ${timestamp}

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

🕒 <b>Time:</b> ${timestamp}

#uiFromMarsError`;
  }

  formatSkipped(stats) {
    return `ℹ️ <b>Posting window update</b>

Posts today: ${stats.total}
Remaining windows: ${stats.remainingWindows.length}

#uiFromMarsStatus`;
  }
}

module.exports = TelegramNotifier;
