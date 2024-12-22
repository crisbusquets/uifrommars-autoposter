const { TwitterApi } = require("twitter-api-v2");
const LinkedInClient = require("linkedin-api-client");

class SocialMediaClient {
  constructor() {
    this.twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    this.linkedin = new LinkedInClient({
      token: process.env.LINKEDIN_ACCESS_TOKEN,
    });
  }

  async post(message) {
    await Promise.all([this.twitter.v2.tweet(message), this.linkedin.post(message)]);
  }
}

module.exports = SocialMediaClient;
