require("dotenv").config();

// Import the new helpers
const logger = require("../lib/logger");
const { checkConfig } = require("../lib/config-check");

// Your existing imports
const GoogleSheetsClient = require("../lib/google.js");
const TwitterClient = require("../lib/twitter.js");
const LinkedInClient = require("../lib/linkedin.js");
const { shouldPostNow, formatDisplayTime } = require("../lib/posting-windows");
const TelegramNotifier = require("../lib/telegram-notifications.js");
const UpstashScheduler = require("../lib/upstash");

exports.handler = async function (event, context) {
  logger.info("Autoposter function triggered");

  try {
    // Check config first thing
    checkConfig();
    logger.info("✅ Configuration validated");
  } catch (configError) {
    logger.error("Configuration validation failed", configError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration error", details: configError.message }),
    };
  }

  const notifier = new TelegramNotifier();
  const body = JSON.parse(event.body || "{}");
  const windowName = body.payload?.windowName;

  // Signature verification (your existing code)
  if (event.headers["upstash-signature"]) {
    try {
      const scheduler = new UpstashScheduler();
      logger.info("Verifying QStash signature");

      if (process.env.NETLIFY_DEV) {
        logger.info("Skipping signature verification in local dev");
      } else {
        const isValid = await scheduler.verifySignature(event.headers["upstash-signature"], event.body);

        if (!isValid) {
          logger.error("Invalid QStash signature received");
          await notifier.sendMessage(notifier.formatSkip("signature"));
          return {
            statusCode: 401,
            body: JSON.stringify({ error: "Invalid signature" }),
          };
        }
        logger.success("QStash signature verified");
      }
    } catch (error) {
      logger.error("Signature verification failed", error);
      if (!process.env.NETLIFY_DEV) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Signature verification failed" }),
        };
      }
    }
  }

  // Window name validation
  if (!windowName) {
    logger.error("No window name provided in request");
    await notifier.sendMessage(notifier.formatSkip("no-window"));
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No window name provided" }),
    };
  }

  // Check LinkedIn token expiry
  const LinkedInTokenMonitor = require("../lib/linkedin-token-monitor");
  const tokenMonitor = new LinkedInTokenMonitor();
  await tokenMonitor.checkTokenExpiry();

  // Posting window check
  if (!shouldPostNow(windowName)) {
    logger.info(`Skipping post - not in posting window: ${windowName}`);
    try {
      await notifier.sendMessage(notifier.formatSkip("window", `Window: ${windowName}`));
    } catch (error) {
      logger.warn("Failed to send skip notification", error);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post skipped - not in posting window" }),
    };
  }

  logger.info(`✅ In valid posting window: ${windowName}`);

  const googleClient = new GoogleSheetsClient();
  const twitterClient = new TwitterClient();
  const linkedInClient = new LinkedInClient();

  let results = {
    twitter: null,
    linkedin: null,
  };

  let atLeastOneSuccess = false;

  try {
    // Get posts from Google Sheets
    logger.info("Fetching posts from Google Sheets");
    const posts = await googleClient.getPosts();
    logger.success(`Retrieved ${posts.length} posts from spreadsheet`);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    logger.info("Filtering eligible posts", {
      currentTime: new Date(now).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
      cutoffTime: new Date(thirtyDaysAgo).toISOString(),
    });

    const eligiblePosts = posts.filter((post) => {
      const lastPosted = post.lastPosted ? new Date(post.lastPosted).getTime() : 0;
      const isEligible = lastPosted < thirtyDaysAgo;

      logger.info(`Post eligibility: ${post.url.substring(0, 50)}...`, {
        lastPosted: post.lastPosted || "Never",
        eligible: isEligible,
      });

      return isEligible;
    });

    if (eligiblePosts.length === 0) {
      logger.warn("No eligible posts found - all posts are too recent");
      try {
        await notifier.sendMessage(notifier.formatSkip("no-posts"));
      } catch (error) {
        logger.warn("Failed to send no-posts notification", error);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No eligible posts - all posts are too recent" }),
      };
    }

    // Select random post
    const post = eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)];
    logger.success("Selected post", {
      url: post.url.substring(0, 50) + "...",
      title: post.title,
    });

    const messages = post.messages
      .split("|")
      .map((m) => m.trim())
      .filter(Boolean);

    const message = messages[Math.floor(Math.random() * messages.length)];
    logger.success("Selected message", {
      preview: message.substring(0, 100) + "...",
      totalOptions: messages.length,
    });

    // Post to Twitter
    if (process.env.ENABLE_TWITTER === "true") {
      try {
        logger.info("Posting to Twitter");
        results.twitter = await twitterClient.post(message, post.url);
        logger.success("Twitter posting successful", { tweetId: results.twitter?.data?.id });
        atLeastOneSuccess = true;
      } catch (twitterError) {
        logger.error("Twitter posting failed", twitterError);
        results.twitter = { error: twitterError.message };
      }
    } else {
      logger.info("Twitter posting disabled");
    }

    // Post to LinkedIn
    if (process.env.ENABLE_LINKEDIN === "true") {
      try {
        logger.info("Posting to LinkedIn");
        results.linkedin = await linkedInClient.post(message, post.url, post.title, post.ogImage);
        logger.success("LinkedIn posting successful", { postId: results.linkedin?.id });
        atLeastOneSuccess = true;
      } catch (linkedinError) {
        logger.error("LinkedIn posting failed", linkedinError);
        results.linkedin = { error: linkedinError.message };
      }
    } else {
      logger.info("LinkedIn posting disabled");
    }

    // Update and notify if successful
    if (atLeastOneSuccess) {
      try {
        logger.info("Updating last posted timestamp");
        await googleClient.updateLastPosted(post.url);
        logger.success("Last posted timestamp updated");

        try {
          await notifier.sendMessage(notifier.formatPost(post, message, results));
          logger.success("Success notification sent");
        } catch (notifyError) {
          logger.warn("Failed to send success notification", notifyError);
        }
      } catch (updateError) {
        logger.error("Failed to update last posted date", updateError);
      }
    } else {
      logger.error("No platforms posted successfully", { results });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Posting completed",
        success: atLeastOneSuccess,
        post: post.url,
        results,
        timestamp: formatDisplayTime(new Date()),
        window: windowName,
      }),
    };
  } catch (error) {
    logger.error("Critical error in scheduled posting", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || error.stack,
      }),
    };
  }
};
