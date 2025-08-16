// scripts/exchange-linkedin-code.js
require("dotenv").config();
const axios = require("axios");

const authCode = process.argv[2];

if (!authCode) {
  console.error("❌ Please provide the authorization code:");
  console.log("Usage: node scripts/exchange-linkedin-code.js YOUR_CODE_HERE");
  process.exit(1);
}

if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
  console.error("❌ Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env file");
  process.exit(1);
}

async function exchangeCodeForToken() {
  console.log("🔄 Exchanging authorization code for access token...\n");

  try {
    const response = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: authCode,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: "http://localhost:8080/callback",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

    console.log("✅ Success! Here's your new LinkedIn access token:\n");
    console.log(`LINKEDIN_ACCESS_TOKEN=${accessToken}`);
    console.log(`\nToken expires in: ${expiresIn} seconds (${Math.round(expiresIn / 86400)} days)`);

    // Get user info to find the user ID
    console.log("\n🔍 Getting your LinkedIn user ID...");

    const userResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202411",
      },
    });

    const userId = userResponse.data.sub;
    console.log(`LINKEDIN_USER_ID=${userId}`);

    // Generate the creation timestamp
    const now = new Date().toISOString();
    console.log(`LINKEDIN_TOKEN_CREATED=${now}`);

    console.log("\n📝 Update your .env file with these values:");
    console.log(`LINKEDIN_ACCESS_TOKEN=${accessToken}`);
    console.log(`LINKEDIN_USER_ID=${userId}`);
    console.log(`LINKEDIN_TOKEN_CREATED=${now}`);

    console.log("\n📤 Also update these in Netlify:");
    console.log("Go to: Netlify Dashboard → Your Site → Site Settings → Environment Variables");
    console.log("Update the same 3 variables there");

    console.log("\n✅ All done! Run 'npm test' to verify the new token works.");
  } catch (error) {
    console.error("❌ Error exchanging code for token:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }

    console.log("\n💡 Common issues:");
    console.log("- Authorization code expired (try getting a new one)");
    console.log("- Wrong redirect URI in LinkedIn app settings");
    console.log("- Client ID/Secret mismatch");
  }
}

exchangeCodeForToken();
