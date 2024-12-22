const { TwitterApi } = require("twitter-api-v2");
const { LinkedIn } = require("linkedin-api-client");

class SocialMediaClient {
  constructor() {
    this.twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    this.linkedin = new LinkedIn({
      token: process.env.LINKEDIN_ACCESS_TOKEN,
    });
  }

  async post(message) {
    await Promise.all([
      this.twitter.v2.tweet({ text: message }),
      this.linkedin.post.share({
        content: {
          contentEntities: [],
          title: "",
          description: message,
        },
        distribution: {
          linkedInDistributionTarget: {
            visibleToGuest: true,
          },
        },
        owner: "urn:li:person:" + process.env.LINKEDIN_USER_ID,
        subject: "",
        text: { text: message },
      }),
    ]);
  }
}

module.exports = SocialMediaClient;
