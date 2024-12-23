// scheduled-poster.js
const GoogleSheetsClient = require("../../src/clients/google");
const SocialMediaClient = require("../../src/clients/social");

exports.handler = async (event) => {
  try {
    const sheets = new GoogleSheetsClient();
    const social = new SocialMediaClient();

    const posts = await sheets.getPosts();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Filter eligible posts
    const eligiblePosts = posts.filter((post) => {
      const lastPosted = post.lastPosted ? new Date(post.lastPosted).getTime() : 0;
      return lastPosted < thirtyDaysAgo;
    });

    if (eligiblePosts.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: "No eligible posts" }) };
    }

    // Select random post and message
    const post = eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)];
    const messages = post.messages
      .split("|")
      .map((m) => m.trim())
      .filter(Boolean);
    const message = messages[Math.floor(Math.random() * messages.length)];

    // Post to social media
    await social.post(message);

    // Update last posted date in Google Sheet
    await sheets.updateLastPosted(post.url);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Posted successfully: ${message}` }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
