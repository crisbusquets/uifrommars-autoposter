require("dotenv").config();
const GoogleSheetsClient = require("../../src/clients/google.js");
const TwitterClient = require("../../src/clients/twitter.js");
const LinkedInClient = require("../../src/clients/linkedin.js");
const { isWithinTimeWindow, shouldPostNow, getPostingStats } = require("../../src/clients/time-windows.js");
const TelegramNotifier = require("../../src/clients/telegram-notifications.js");

exports.handler = async (event, context) => {
  const notifier = new TelegramNotifier();

  // Check if we're within a posting window and should post
  if (!shouldPostNow()) {
    const stats = getPostingStats();
    await notifier.sendMessage(notifier.formatSkipped(stats));
    console.log("Skipping post. Current stats:", stats);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Post skipped - outside window or probability check failed",
        stats,
      }),
    };
  }

  // Initialize clients
  const googleClient = new GoogleSheetsClient();
  const twitterClient = new TwitterClient();
  const linkedInClient = new LinkedInClient();

  let results = {
    twitter: null,
    linkedin: null,
  };

  try {
    // Get posts from Google Sheets
    const posts = await googleClient.getPosts();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    console.log("Current time (Spanish):", new Date(now).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }));
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
      await notifier.sendMessage("ℹ️ No eligible posts found - all posts are too recent");
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

    // Handle Twitter posting
    if (process.env.ENABLE_TWITTER === "true") {
      try {
        results.twitter = await twitterClient.post(message, post.url);
        console.log("Twitter posting successful:", results.twitter);
      } catch (twitterError) {
        console.error("Error posting to Twitter:", twitterError);
        await notifier.sendMessage(notifier.formatError(twitterError));
        results.twitter = { error: twitterError.message };
      }
    } else {
      console.log("Twitter posting disabled");
    }

    // Handle LinkedIn posting
    if (process.env.ENABLE_LINKEDIN === "true") {
      try {
        results.linkedin = await linkedInClient.post(message, post.url, post.ogImage, post.title);
        console.log("LinkedIn posting successful:", results.linkedin);
      } catch (linkedinError) {
        console.error("Error posting to LinkedIn:", linkedinError);
        await notifier.sendMessage(notifier.formatError(linkedinError));
        results.linkedin = { error: linkedinError.message };
      }
    } else {
      console.log("LinkedIn posting disabled");
    }

    // Update last posted date if at least one platform was successful
    if (results.twitter || results.linkedin) {
      await googleClient.updateLastPosted(post.url);
      await notifier.sendMessage(notifier.formatPost(post, message, results));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Posting completed",
        post: post.url,
        results,
        timestamp: new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
      }),
    };
  } catch (error) {
    console.error("Error in scheduled posting:", error);
    await notifier.sendMessage(notifier.formatError(error));
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || error.stack,
      }),
    };
  }
};
