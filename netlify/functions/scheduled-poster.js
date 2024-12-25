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

    console.log("All posts:", posts);
    console.log("Thirty days ago:", new Date(thirtyDaysAgo).toISOString());

    // Filter eligible posts
    const eligiblePosts = posts.filter((post) => {
      const lastPosted = post.lastPosted ? new Date(post.lastPosted).getTime() : 0;
      const isEligible = lastPosted < thirtyDaysAgo;
      console.log(`Post ${post.url}: last posted ${post.lastPosted}, eligible: ${isEligible}`);
      return isEligible;
    });

    console.log("Eligible posts:", eligiblePosts);

    if (eligiblePosts.length === 0) {
      console.log("No eligible posts found - all posts are too recent");
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "No eligible posts - all posts are too recent" }),
      };
    }

    // Select random post and message
    const post = eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)];
    console.log("Selected post:", post);

    const messages = post.messages
      .split("|")
      .map((m) => m.trim())
      .filter(Boolean);
    console.log("Available messages:", messages);

    const message = messages[Math.floor(Math.random() * messages.length)];
    console.log("Selected message:", message);

    // Post to social media
    console.log("Attempting to post to social media...");
    try {
      const results = await social.post(message, post.url);
      console.log("Social media posting results:", results);
    } catch (error) {
      console.error("Error posting to social media:", error);
      throw error;
    }

    // Update last posted date in Google Sheet
    await sheets.updateLastPosted(post.url);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Posted successfully: ${message}`,
        post: post.url,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || error.stack,
      }),
    };
  }
};
