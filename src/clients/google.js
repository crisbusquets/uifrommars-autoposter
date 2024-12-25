// google.js
const { google } = require("googleapis");

class GoogleSheetsClient {
  constructor() {
    // Create OAuth2 client using credentials
    this.auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

    // Set credentials
    this.auth.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      token_type: "Bearer",
      expiry_date: true, // This will force a refresh if token is expired
    });
  }

  async getPosts() {
    const sheets = google.sheets({ version: "v4", auth: this.auth });

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "A:D", // Only get needed columns
      });

      const [headers, ...rows] = response.data.values || [];
      return rows.map((row) => ({
        url: row[0],
        title: row[1],
        messages: row[2],
        lastPosted: row[3],
      }));
    } catch (error) {
      console.error("Error fetching from Google Sheets:", error);
      throw error;
    }
  }

  async updateLastPosted(url) {
    const sheets = google.sheets({ version: "v4", auth: this.auth });

    try {
      // First, find the row with matching URL
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "A:A",
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex((row) => row[0] === url);

      if (rowIndex === -1) {
        throw new Error(`URL ${url} not found in sheet`);
      }

      // Update the last posted date in column D
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `D${rowIndex + 1}`,
        valueInputOption: "RAW",
        resource: {
          values: [[new Date().toISOString()]],
        },
      });
    } catch (error) {
      console.error("Error updating last posted date:", error);
      throw error;
    }
  }
}

module.exports = GoogleSheetsClient;
