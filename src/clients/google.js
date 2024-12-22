const { google } = require("googleapis");
const { UserRefreshClient, GoogleAuth, Impersonated } = require("google-auth-library");

class GoogleSheetsClient {
  constructor() {
    this.client = null;
  }

  async initialize() {
    const auth = new GoogleAuth({
      credentials: {
        type: "external_account",
        audience: process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
        token_url: "https://sts.googleapis.com/v1/token",
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/uifrommars-autoposter@uifrommars-autopost.iam.gserviceaccount.com:generateAccessToken`,
        credential_source: {
          url: "https://token.netlify.app/.netlify/functions/scheduled-poster",
          headers: {},
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const authClient = await auth.getClient();
    this.client = google.sheets({
      version: "v4",
      auth: authClient,
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

      console.log("Sheets response:", response.data);
      return response.data.values || [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }
}

module.exports = GoogleSheetsClient;
