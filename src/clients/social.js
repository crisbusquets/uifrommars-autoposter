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
      idToken: process.env.LINKEDIN_ID_TOKEN,
    };
  }

  async post(message) {
    try {
      const [twitterResponse, linkedinResponse] = await Promise.all([
        this.twitter.v2.tweet({ text: message }),
        this.postToLinkedIn(message),
      ]);

      console.log("Posted successfully to Twitter and LinkedIn");
      return { twitter: twitterResponse, linkedin: linkedinResponse };
    } catch (error) {
      console.error("Error posting to social media:", error);
      throw error;
    }
  }

  async postToLinkedIn(message) {
    const url = "https://api.linkedin.com/v2/shares";
    const data = {
      owner: `urn:li:person:${this.linkedInCredentials.idToken}`,
      text: {
        text: message,
      },
      distribution: {
        linkedInDistributionTarget: {
          visibleToGuest: true,
        },
      },
    };

    const headers = {
      Authorization: `Bearer ${this.linkedInCredentials.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      console.error("LinkedIn API error:", error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

module.exports = SocialMediaClient;
