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

    this.linkedInCredentials = {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    };
  }

  async post(message, url, title) {
    try {
      console.log("Attempting to post to Twitter and LinkedIn...");
      const results = await Promise.allSettled([
        this.postToTwitter(message, url),
        this.postToLinkedIn(message, url, title),
      ]);

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

  async verifyLinkedInToken() {
    try {
      const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${this.linkedInCredentials.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });
      console.log("LinkedIn token verification response:", response.data);
      return response.status === 200;
    } catch (error) {
      console.error("LinkedIn token verification failed:", error.response?.data);
      return false;
    }
  }

  async postToLinkedIn(message, url, title) {
    // Verify token before posting
    const isTokenValid = await this.verifyLinkedInToken();
    if (!isTokenValid) {
      throw new Error("LinkedIn token is invalid or expired");
    }
    const data = {
      author: `urn:li:person:O_2_rrs7ZU`,
      commentary: message,
      visibility: "PUBLIC",
      lifecycleState: "PUBLISHED",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        article: {
          source: url,
          title: title,
          description: message,
        },
      },
    };

    try {
      const response = await axios.post("https://api.linkedin.com/rest/posts", data, {
        headers: {
          Authorization: `Bearer ${this.linkedInCredentials.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202411",
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      const errorStatus = error.response?.status;

      let errorMessage = "LinkedIn API error";
      if (errorStatus === 401) {
        errorMessage = "LinkedIn token is unauthorized - needs refresh";
      } else if (errorStatus === 403) {
        errorMessage = "LinkedIn token doesn't have required permissions";
      } else if (errorStatus === 429) {
        errorMessage = "LinkedIn API rate limit exceeded";
      }

      console.error(`${errorMessage}:`, {
        status: errorStatus,
        data: errorData,
        headers: error.response?.headers,
      });

      throw new Error(errorMessage);
    }
  }
}

module.exports = SocialMediaClient;
