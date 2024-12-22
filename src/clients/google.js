const { google } = require("googleapis");

class GoogleSheetsClient {
  constructor() {
    this.client = null;
  }

  async initialize() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NETLIFY_URL
    );

    oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.client = google.sheets({ version: "v4", auth: oauth2Client });
  }

  async getPosts() {
    if (!this.client) await this.initialize();

    const response = await this.client.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Posts!A2:D",
    });

    return response.data.values || [];
  }
}

module.exports = GoogleSheetsClient;
