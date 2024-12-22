const GoogleSheetsClient = require("../../src/clients/google");
const GitHubClient = require("../../src/clients/github");
const SocialMediaClient = require("../../src/clients/social");
const PostManager = require("../../src/utils/post-manager");

exports.handler = async (event) => {
  try {
    const sheets = new GoogleSheetsClient();
    const github = new GitHubClient();
    const social = new SocialMediaClient();

    const posts = await sheets.getPosts();
    const history = await github.getPostHistory();
    const post = PostManager.getEligiblePost(posts, history);

    if (!post) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No eligible posts found" }),
      };
    }

    const [url, title, messages] = post;
    const message = PostManager.getRandomMessage(messages);

    await social.post(message);

    history.posts[url] = Date.now();
    await github.updatePostHistory(history);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Posted successfully: ${message}`,
        url,
        title,
      }),
    };
  } catch (error) {
    console.error("Error in scheduled poster:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
