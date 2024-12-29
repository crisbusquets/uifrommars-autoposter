const { google } = require("googleapis");

class GoogleSheetsClient {
  // Column mapping constants
  static COLUMNS = {
    URL: 0, // Column A
    OG_IMAGE: 1, // Column B
    TITLE: 2, // Column C
    MESSAGES: 3, // Column D
    LAST_POSTED: 4, // Column E
  };

  constructor() {
    this.auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

    this.auth.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      token_type: "Bearer",
      expiry_date: true,
    });
  }

  async getPosts() {
    const sheets = google.sheets({ version: "v4", auth: this.auth });

    try {
      console.log("Fetching posts from Google Sheets...");

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "A:E",
      });

      const rows = response.data.values || [];
      console.log(`Found ${rows.length} rows (including header)`);

      if (rows.length <= 1) {
        console.log("No data rows found in spreadsheet");
        return [];
      }

      // Log header row to verify column order
      const [header, ...dataRows] = rows;
      console.log("Spreadsheet headers:", header);

      const posts = dataRows.map((row, index) => {
        const post = {
          url: row[GoogleSheetsClient.COLUMNS.URL] || "",
          ogImage: row[GoogleSheetsClient.COLUMNS.OG_IMAGE] || "",
          title: row[GoogleSheetsClient.COLUMNS.TITLE] || "",
          messages: row[GoogleSheetsClient.COLUMNS.MESSAGES] || "",
          lastPosted: row[GoogleSheetsClient.COLUMNS.LAST_POSTED] || null,
        };

        // Debug log for each processed row
        console.log(`Row ${index + 2} processed:`, {
          url: post.url.substring(0, 50) + "...",
          ogImage: post.ogImage.substring(0, 50) + "...",
          title: post.title,
          messagesPreview: post.messages.substring(0, 50) + "...",
          lastPosted: post.lastPosted,
        });

        return post;
      });

      console.log(`Successfully processed ${posts.length} posts`);
      return posts;
    } catch (error) {
      console.error("Error fetching from Google Sheets:", error);
      throw error;
    }
  }

  async updateLastPosted(url) {
    const sheets = google.sheets({ version: "v4", auth: this.auth });

    try {
      console.log(`Updating last posted date for URL: ${url}`);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "A:A",
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex((row) => row[0] === url);

      if (rowIndex === -1) {
        throw new Error(`URL ${url} not found in sheet`);
      }

      console.log(`Found URL in row ${rowIndex + 1}`);

      const now = new Date().toISOString();
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `E${rowIndex + 1}`,
        valueInputOption: "RAW",
        resource: {
          values: [[now]],
        },
      });

      console.log(`Successfully updated last posted date to ${now}`);
    } catch (error) {
      console.error("Error updating last posted date:", error);
      throw error;
    }
  }
}

module.exports = GoogleSheetsClient;
