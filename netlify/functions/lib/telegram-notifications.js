const axios = require("axios");
const { formatDisplayTime } = require("./posting-windows");

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
    if (results.twitter?.data?.id) {
      platforms.push("𝕏 Twitter");
    }
    if (results.linkedin?.id) {
      platforms.push("💼 LinkedIn");
    }

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

  formatSkipped() {
    return `ℹ️ <b>Post skipped</b>

Probability check failed.

#uiFromMarsStatus`;
  }
}

module.exports = TelegramNotifier;
