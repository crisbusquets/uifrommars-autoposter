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
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
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

  async uploadImage(imageUrl) {
    try {
      // First, register the image upload
      const registerResponse = await axios.post(
        "https://api.linkedin.com/v2/images",
        {
          initializeUploadRequest: {
            owner: `urn:li:person:${process.env.LINKEDIN_USER_ID}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      // Get the image data from the URL
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(imageResponse.data, "binary");

      // Upload the image using the upload URL from the register response
      const uploadUrl = registerResponse.data.value.uploadUrl;
      const imageUrn = registerResponse.data.value.image;

      await axios.put(uploadUrl, imageBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      return imageUrn;
    } catch (error) {
      console.error("Error uploading image to LinkedIn:", error);
      return null;
    }
  }

  async post(message, url, ogImage, title) {
    // Verify token before posting
    const isTokenValid = await this.verifyToken();
    if (!isTokenValid) {
      throw new Error("LinkedIn token is invalid or expired");
    }

    console.log("LinkedIn Post Creation:", {
      userId: process.env.LINKEDIN_USER_ID,
      messagePreview: message.substring(0, 100),
      urlPreview: url.substring(0, 100),
      ogImagePreview: ogImage?.substring(0, 100),
      titleFromSpreadsheet: title,
    });

    const data = {
      author: `urn:li:person:${process.env.LINKEDIN_USER_ID}`,
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
          thumbnail: ogImage,
        },
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    if (ogImage) {
      try {
        const imageUrn = await this.uploadImage(ogImage);
        if (imageUrn) {
          data.content.article.thumbnail = imageUrn;
        }
      } catch (error) {
        console.error("Failed to upload image, continuing without thumbnail:", error);
      }
    }

    try {
      const response = await axios.post("https://api.linkedin.com/rest/posts", data, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
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

module.exports = LinkedInClient;
