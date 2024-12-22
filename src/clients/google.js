const { google } = require("googleapis");

class GoogleSheetsClient {
  constructor() {
    this.client = null;
  }

  async initialize() {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      clientOptions: {
        credentials: {
          type: "external_account",
          audience: `//iam.googleapis.com/${process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER}`,
          subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
          token_url: "https://sts.googleapis.com/v1/token",
          service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
          credential_source: {
            url: `${process.env.NETLIFY_URL}/.netlify/functions/token`,
            headers: {},
            format: {
              type: "json",
              subject_token_field_name: "access_token",
            },
          },
        },
      },
    });

    this.client = google.sheets({
      version: "v4",
      auth: await auth.getClient(),
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
      console.error("Error fetching posts:", error.message);
      if (error.response) {
        console.error("Error details:", error.response.data);
      }
      throw error;
    }
  }
}

module.exports = GoogleSheetsClient;
