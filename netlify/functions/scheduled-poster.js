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

    console.log("Total posts fetched:", posts.length);

    // Filter eligible posts with better date handling
    const eligiblePosts = posts.filter((post) => {
      // If no lastPosted date exists, post is eligible
      if (!post.lastPosted) {
        console.log(`Post ${post.url} has never been posted - eligible`);
        return true;
      }

      let lastPostedDate;
      try {
        // Try to parse the date
        lastPostedDate = new Date(post.lastPosted).getTime();
        // Check if we got a valid date
        if (isNaN(lastPostedDate)) {
          console.log(`Post ${post.url} has invalid date format - treating as eligible`);
          return true;
        }
      } catch (error) {
        console.log(`Post ${post.url} has unparseable date - treating as eligible`);
        return true;
      }

      const isEligible = lastPostedDate < thirtyDaysAgo;
      console.log(`Post ${post.url}: last posted ${post.lastPosted}, eligible: ${isEligible}`);
      return isEligible;
    });

    console.log("Eligible posts found:", eligiblePosts.length);

    if (eligiblePosts.length === 0) {
      console.log("No eligible posts found - all posts are too recent");
      return {
        statusCode: 200,
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
      const results = await social.post(message, post.url, post.title);
      console.log("Social media posting results:", results);
    } catch (error) {
      console.error("Error posting to social media:", error);
      throw error;
    }

    // Update last posted date in Google Sheet
    await sheets.updateLastPosted(post.url);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Posted successfully: ${message}`,
        post: post.url,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || error.stack,
      }),
    };
  }
};
