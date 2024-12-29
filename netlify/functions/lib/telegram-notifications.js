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
    const platforms = [results.twitter && "𝕏 Twitter", results.linkedin && "💼 LinkedIn"].filter(Boolean);

    const timestamp = new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      hour12: false,
      dateStyle: "medium",
      timeStyle: "short",
    });

    return `🚀 <b>New Post Published!</b>

📝 <b>Message:</b>
${message}

🔗 <b>Blog Post:</b>
${post.url}

📢 <b>Platforms:</b> ${platforms.join(", ")}

🕒 <b>Posted at:</b> ${timestamp}

#UIFromMars #AutoPoster`;
  }

  formatError(error) {
    const timestamp = new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      hour12: false,
    });

    return `❌ <b>Posting Error</b>

⚠️ <b>Error Message:</b>
${error.message}

🕒 <b>Time:</b> ${timestamp}

#UIFromMarsError`;
  }

  formatSkipped(stats) {
    return `ℹ️ <b>Posting Window Update</b>

Posts today: ${stats.total}
Remaining windows: ${stats.remainingWindows.length}

#UIFromMarsStatus`;
  }
}

module.exports = TelegramNotifier;
