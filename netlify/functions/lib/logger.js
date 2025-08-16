// netlify/functions/lib/logger.js
const TelegramNotifier = require("./telegram-notifications");

class Logger {
  constructor() {
    this.notifier = new TelegramNotifier();
  }

  // Use this instead of console.log for important info
  info(message, details = "") {
    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    console.log(`[${timestamp}] INFO: ${message}`, details);
  }

  // Use this when something goes wrong but doesn't break everything
  warn(message, details = "") {
    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    console.warn(`[${timestamp}] WARN: ${message}`, details);
  }

  // Use this for errors - automatically sends to Telegram
  async error(message, error = null) {
    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    console.error(`[${timestamp}] ERROR: ${message}`, error);

    try {
      if (error) {
        await this.notifier.sendMessage(`🚨 ERROR: ${message}\n\nDetails: ${error.message || error}`);
      } else {
        await this.notifier.sendMessage(`🚨 ERROR: ${message}`);
      }
    } catch (telegramError) {
      console.error("Failed to send error to Telegram:", telegramError);
    }
  }

  // Use this for successful operations
  success(message, details = "") {
    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    console.log(`[${timestamp}] SUCCESS: ${message}`, details);
  }
}

module.exports = new Logger();
