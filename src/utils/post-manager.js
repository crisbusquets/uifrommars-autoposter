class PostManager {
  static getEligiblePost(posts, history) {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const eligiblePosts = posts.filter((post) => {
      const lastPosted = history.posts[post[0]] || 0;
      return lastPosted < thirtyDaysAgo;
    });

    if (eligiblePosts.length === 0) return null;
    return eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)];
  }

  static getRandomMessage(messages) {
    const variants = messages
      .split("|")
      .map((m) => m.trim())
      .filter(Boolean);
    return variants[Math.floor(Math.random() * variants.length)];
  }
}

module.exports = PostManager;
