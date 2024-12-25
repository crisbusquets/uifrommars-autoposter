const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");

class SocialMediaClient {
  constructor() {
    this.twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // Initialize LinkedIn credentials
    this.linkedInCredentials = {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    };
    console.log("LinkedIn Client:", this.linkedin);
  }

  async post(message, url) {
    try {
      console.log("Attempting to post to Twitter and LinkedIn...");

      // Post to both platforms in parallel
      const results = await Promise.allSettled([this.postToTwitter(message, url), this.postToLinkedIn(message, url)]);

      // Log individual results
      results.forEach((result, index) => {
        const platform = index === 0 ? "Twitter" : "LinkedIn";
        if (result.status === "fulfilled") {
          console.log(`Posted successfully to ${platform}:`, result.value);
        } else {
          console.error(`Failed to post to ${platform}:`, result.reason);
        }
      });

      return results;
    } catch (error) {
      console.error("Error posting to social media:", error);
      throw error;
    }
  }

  async postToTwitter(message, url) {
    console.log("Posting to Twitter:", message, url);
    const tweetText = url ? `${message}\n\n${url}` : message;
    return await this.twitter.v2.tweet({ text: tweetText });
  }

  async postToLinkedIn(message, url) {
    console.log("Posting to LinkedIn:", message, url);

    const headers = {
      Authorization: `Bearer ${this.linkedInCredentials.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };

    try {
      const data = {
        author: `urn:li:member:${process.env.LINKEDIN_USER_ID}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: message,
            },
            shareMediaCategory: url ? "ARTICLE" : "NONE",
            media: url
              ? [
                  {
                    status: "READY",
                    originalUrl: url,
                  },
                ]
              : undefined,
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      console.log("LinkedIn request data:", JSON.stringify(data, null, 2));
      const response = await axios.post("https://api.linkedin.com/v2/ugcPosts", data, { headers });
      return response.data;
    } catch (error) {
      console.error("LinkedIn API error:", error.response?.data || error);
      throw error;
    }
  }
}

module.exports = SocialMediaClient;
