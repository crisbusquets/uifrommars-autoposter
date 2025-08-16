// scripts/refresh-linkedin-token.js
require("dotenv").config();

console.log("🔑 LinkedIn Token Refresh Helper\n");

// Check if we have the required credentials
if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
  console.error("❌ Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env file");
  console.log("\nYou need to add these to your .env file:");
  console.log("LINKEDIN_CLIENT_ID=your_client_id");
  console.log("LINKEDIN_CLIENT_SECRET=your_client_secret");
  console.log("\nGet these from: https://www.linkedin.com/developers/apps");
  process.exit(1);
}

const clientId = process.env.LINKEDIN_CLIENT_ID;
const redirectUri = "http://localhost:8080/callback"; // We'll use this temporarily
const scope = "w_member_social,openid,profile,email"; // Current LinkedIn scopes

// Step 1: Generate the authorization URL
const authUrl =
  `https://www.linkedin.com/oauth/v2/authorization?` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=${encodeURIComponent(scope)}`;

console.log("📋 Follow these steps to get a new LinkedIn token:\n");

console.log("1. First, add this redirect URI to your LinkedIn app:");
console.log("   Go to: https://www.linkedin.com/developers/apps");
console.log("   Select your app → Auth tab → Add this redirect URL:");
console.log(`   ${redirectUri}`);

console.log("\n2. Copy and paste this URL in your browser:");
console.log(`   ${authUrl}`);

console.log("\n3. After authorizing, LinkedIn will redirect you to:");
console.log(`   ${redirectUri}?code=SOME_CODE&state=...`);

console.log("\n4. Copy the 'code' parameter from the URL and run:");
console.log("   node scripts/exchange-linkedin-code.js YOUR_CODE_HERE");

console.log("\n✅ Ready! Copy the URL above and paste it in your browser.");
