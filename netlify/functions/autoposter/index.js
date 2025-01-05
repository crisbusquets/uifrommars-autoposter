require("dotenv").config();
const GoogleSheetsClient = require("../lib/google.js");
const TwitterClient = require("../lib/twitter.js");
const LinkedInClient = require("../lib/linkedin.js");
const { shouldPostNow, formatDisplayTime } = require("../lib/posting-windows");
const TelegramNotifier = require("../lib/telegram-notifications.js");
const UpstashScheduler = require("../lib/upstash");

exports.handler = async function (event, context) {
  console.log("Function triggered with body:", event.body);

  const notifier = new TelegramNotifier();
  const body = JSON.parse(event.body || "{}");
  const windowName = body.payload?.windowName;

  // If it's coming from QStash, verify signature
  if (event.headers["upstash-signature"]) {
    try {
      const scheduler = new UpstashScheduler();
      console.log("Headers:", event.headers);

      // Skip verification in local dev
      if (process.env.NETLIFY_DEV) {
        console.log("Skipping signature verification in local dev");
      } else {
        const isValid = await scheduler.verifySignature(event.headers["upstash-signature"], event.body);

        if (!isValid) {
          console.error("Invalid signature received");
          await notifier.sendMessage("❌ QStash signature verification failed");
          return {
            statusCode: 401,
            body: JSON.stringify({ error: "Invalid signature" }),
          };
        }
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      await notifier.sendMessage(`❌ QStash error: ${error.message}`);
      // Don't return error in dev
      if (!process.env.NETLIFY_DEV) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Signature verification failed" }),
        };
      }
    }
  }

  if (!windowName) {
    console.error("No window name provided");
    await notifier.sendMessage("❌ No window name provided in request");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No window name provided" }),
    };
  }

  if (!shouldPostNow(windowName)) {
    console.log("Skipping post - probability check failed");
    try {
      await notifier.sendMessage(notifier.formatSkipped());
    } catch (error) {
      console.error("Failed to send skip notification:", error);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post skipped - probability check failed" }),
    };
  }

  const googleClient = new GoogleSheetsClient();
  const twitterClient = new TwitterClient();
  const linkedInClient = new LinkedInClient();

  let results = {
    twitter: null,
    linkedin: null,
  };

  let atLeastOneSuccess = false;

  try {
    const posts = await googleClient.getPosts();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    console.log("Current time (Spanish):", new Date(now).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }));
    console.log("Thirty days ago:", new Date(thirtyDaysAgo).toISOString());

    const eligiblePosts = posts.filter((post) => {
      const lastPosted = post.lastPosted ? new Date(post.lastPosted).getTime() : 0;
      const isEligible = lastPosted < thirtyDaysAgo;
      console.log(`Post ${post.url}: last posted ${post.lastPosted}, eligible: ${isEligible}`);
      return isEligible;
    });

    if (eligiblePosts.length === 0) {
      console.log("No eligible posts found - all posts are too recent");
      try {
        await notifier.sendMessage("ℹ️ No eligible posts found - all posts are too recent");
      } catch (error) {
        console.error("Failed to send no-posts notification:", error);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No eligible posts - all posts are too recent" }),
      };
    }

    const post = eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)];
    console.log("Selected post:", post);

    const messages = post.messages
      .split("|")
      .map((m) => m.trim())
      .filter(Boolean);

    const message = messages[Math.floor(Math.random() * messages.length)];
    console.log("Selected message:", message);

    if (process.env.ENABLE_TWITTER === "true") {
      try {
        results.twitter = await twitterClient.post(message, post.url);
        console.log("Twitter posting successful:", results.twitter);
        atLeastOneSuccess = true;
      } catch (twitterError) {
        console.error("Error posting to Twitter:", twitterError);
        try {
          await notifier.sendMessage(notifier.formatError(twitterError));
        } catch (notifyError) {
          console.error("Failed to send Twitter error notification:", notifyError);
        }
        results.twitter = { error: twitterError.message };
      }
    }

    if (process.env.ENABLE_LINKEDIN === "true") {
      try {
        results.linkedin = await linkedInClient.post(message, post.url, post.title, post.ogImage);
        console.log("LinkedIn posting successful:", results.linkedin);
        atLeastOneSuccess = true;
      } catch (linkedinError) {
        console.error("Error posting to LinkedIn:", linkedinError);
        try {
          await notifier.sendMessage(notifier.formatError(linkedinError));
        } catch (notifyError) {
          console.error("Failed to send LinkedIn error notification:", notifyError);
        }
        results.linkedin = { error: linkedinError.message };
      }
    }

    if (atLeastOneSuccess) {
      try {
        await googleClient.updateLastPosted(post.url);
        try {
          await notifier.sendMessage(notifier.formatPost(post, message, results));
        } catch (notifyError) {
          console.error("Failed to send success notification:", notifyError);
        }
      } catch (updateError) {
        console.error("Failed to update last posted date:", updateError);
        try {
          await notifier.sendMessage(notifier.formatError(updateError));
        } catch (notifyError) {
          console.error("Failed to send update error notification:", notifyError);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Posting completed",
        post: post.url,
        results,
        timestamp: formatDisplayTime(new Date()),
        window: windowName,
      }),
    };
  } catch (error) {
    console.error("Error in scheduled posting:", error);
    try {
      await notifier.sendMessage(notifier.formatError(error));
    } catch (notifyError) {
      console.error("Failed to send general error notification:", notifyError);
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || error.stack,
      }),
    };
  }
};
