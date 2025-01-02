const axios = require("axios");

class LinkedInClient {
  constructor() {
    this.credentials = {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    };
  }

  async verifyToken() {
    try {
      const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: this.getHeaders(),
      });
      console.log("LinkedIn token verification response:", response.data);
      return response.status === 200;
    } catch (error) {
      console.error("LinkedIn token verification failed:", error.response?.data);
      return false;
    }
  }

  async post(message, url, title) {
    const isTokenValid = await this.verifyToken();
    if (!isTokenValid) {
      throw new Error("LinkedIn token is invalid or expired");
    }

    console.log("LinkedIn Post Creation:", {
      userId: process.env.LINKEDIN_USER_ID,
      messagePreview: message.substring(0, 100),
      urlPreview: url.substring(0, 100),
      titleFromSpreadsheet: title,
    });

    const postData = {
      author: `urn:li:person:${String(process.env.LINKEDIN_USER_ID).trim().replace("0", "O")}`,
      commentary: message,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        article: {
          source: url,
          title: title || "Blog Post",
          description: message.substring(0, 4000),
        },
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    try {
      const response = await axios.post("https://api.linkedin.com/rest/posts", postData, {
        headers: this.getHeaders(),
      });
      console.log("LinkedIn post created successfully:", response.data);
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

      const detailedError = new Error(errorMessage);
      detailedError.status = errorStatus;
      detailedError.data = errorData;
      detailedError.headers = error.response?.headers;

      throw detailedError;
    }
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
      "LinkedIn-Version": "202411",
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };
  }
}

module.exports = LinkedInClient;
