// netlify/functions/lib/config-check.js

function checkConfig() {
  const errors = [];

  // Essential configs that must exist
  const required = [
    "GOOGLE_SHEET_ID",
    "QSTASH_TOKEN",
    "NETLIFY_WEBHOOK_URL",
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
  ];

  // Check required ones
  required.forEach((key) => {
    if (!process.env[key]) {
      errors.push(`❌ Missing: ${key}`);
    }
  });

  // Check platform-specific configs
  if (process.env.ENABLE_TWITTER === "true") {
    const twitterVars = ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"];
    twitterVars.forEach((key) => {
      if (!process.env[key]) {
        errors.push(`❌ Twitter enabled but missing: ${key}`);
      }
    });
  }

  if (process.env.ENABLE_LINKEDIN === "true") {
    const linkedinVars = ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_USER_ID"];
    linkedinVars.forEach((key) => {
      if (!process.env[key]) {
        errors.push(`❌ LinkedIn enabled but missing: ${key}`);
      }
    });
  }

  // If there are errors, throw them
  if (errors.length > 0) {
    throw new Error(`Configuration Problems:\n${errors.join("\n")}`);
  }

  return true;
}

module.exports = { checkConfig };
