const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");

class GoogleSheetsClient {
  constructor() {
    this.client = null;
  }

  async initialize() {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      projectId: "uifrommars-autopost",
      targetAudience: "https://token.netlify.app",
    });

    const client = await auth.getClient();
    this.client = google.sheets({
      version: "v4",
      auth: client,
    });
  }

  async getPosts() {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const response = await this.client.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Posts!A2:D",
      });

      return response.data.values || [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }
}

module.exports = GoogleSheetsClient;
