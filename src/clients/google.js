// google.js
const { google } = require("googleapis");

class GoogleSheetsClient {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      credentials: {
        type: "external_account",
        audience: process.env.GOOGLE_AUDIENCE,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
        token_url: "https://sts.googleapis.com/v1/token",
        workforce_pool_user_project: process.env.GOOGLE_PROJECT_ID,
        credential_source: {
          url: "/.netlify/functions/token",
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
      },
    });
  }

  async getPosts() {
    const sheets = google.sheets({ version: "v4", auth: this.auth });
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
  }
}

module.exports = GoogleSheetsClient;
