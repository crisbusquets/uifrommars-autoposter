const { TwitterApi } = require("twitter-api-v2");

class TwitterClient {
  constructor() {
    this.twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
  }

  formatTimeUntilReset(resetTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilReset = resetTimestamp - now;

    const hours = Math.floor(secondsUntilReset / 3600);
    const minutes = Math.floor((secondsUntilReset % 3600) / 60);

    const resetDate = new Date(resetTimestamp * 1000);

    return {
      timeUntilReset: `${hours} hours and ${minutes} minutes`,
      exactResetTime: resetDate.toLocaleString(),
      remainingSeconds: secondsUntilReset,
    };
  }

  async post(message, url) {
    try {
      console.log("Posting to Twitter:", message, url);
      const tweetText = url ? `${message}\n\n${url}` : message;

      const result = await this.twitter.v2.tweet({ text: tweetText });
      console.log("Twitter post successful:", result);
      return result;
    } catch (error) {
      if (error.code === 429) {
        // Get 24-hour limit reset from headers
        const dailyReset = error.headers?.["x-app-limit-24hour-reset"];
        const dailyLimit = error.headers?.["x-app-limit-24hour-limit"];

        if (dailyReset) {
          const { timeUntilReset, exactResetTime } = this.formatTimeUntilReset(dailyReset);

          console.error(`Twitter daily post limit (${dailyLimit} posts) reached.`);
          console.error(`Rate limit resets: ${exactResetTime}`);
          console.error(`Time until reset: ${timeUntilReset}`);

          error.message = `Twitter daily limit reached. Resets in ${timeUntilReset} (at ${exactResetTime})`;
        }
      }

      console.error("Error posting to Twitter:", error);
      throw error;
    }
  }
}

module.exports = TwitterClient;
