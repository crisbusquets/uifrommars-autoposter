const { Octokit } = require("@octokit/rest");

class GitHubClient {
  constructor() {
    this.client = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async getPostHistory() {
    try {
      const { data } = await this.client.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: "post-history.json",
      });

      const content = Buffer.from(data.content, "base64").toString();
      return JSON.parse(content);
    } catch (error) {
      return { posts: {} };
    }
  }

  async updatePostHistory(history) {
    const content = Buffer.from(JSON.stringify(history, null, 2)).toString("base64");
    const path = "post-history.json";

    try {
      const { data: existingFile } = await this.client.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      });

      await this.client.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
        message: "Update post history",
        content,
        sha: existingFile.sha,
      });
    } catch (error) {
      await this.client.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
        message: "Create post history",
        content,
      });
    }
  }
}

module.exports = GitHubClient;
