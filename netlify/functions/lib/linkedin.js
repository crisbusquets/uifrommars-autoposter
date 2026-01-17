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

  // New method to initialize image upload
  async initializeImageUpload() {
    try {
      const response = await axios.post(
        "https://api.linkedin.com/rest/images?action=initializeUpload",
        {
          initializeUploadRequest: {
            owner: `urn:li:person:${String(process.env.LINKEDIN_USER_ID).trim().replace("0", "O")}`,
          },
        },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.value;
    } catch (error) {
      console.error("Failed to initialize image upload:", error.response?.data);
      throw error;
    }
  }

  // Helper to check image dimensions
  async checkImageDimensions(imageUrl) {
    try {
      const response = await axios.head(imageUrl);
      const contentLength = response.headers["content-length"];

      // LinkedIn's pixel limit is 36152320
      if (contentLength && parseInt(contentLength) > 36152320) {
        throw new Error("Image exceeds LinkedIn's pixel limit");
      }
    } catch (error) {
      console.warn("Failed to check image dimensions:", error);
      // Continue anyway as the image might still work
    }
  }

  // New method to upload image using the upload URL
  async uploadImage(uploadUrl, imageUrl) {
    try {
      // Check image dimensions before upload
      await this.checkImageDimensions(imageUrl);

      // Use recommended dimensions for LinkedIn
      console.log("Uploading image with recommended dimensions for LinkedIn feed visibility");

      // Fetch the image from the provided URL
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      // Upload to LinkedIn's URL
      await axios.put(uploadUrl, imageResponse.data, {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  }

  async post(message, url, title, imageUrl = null) {
    const isTokenValid = await this.verifyToken();
    if (!isTokenValid) {
      throw new Error("LinkedIn token is invalid or expired");
    }

    console.log("LinkedIn Post Creation:", {
      userId: process.env.LINKEDIN_USER_ID,
      messagePreview: message.substring(0, 100),
      urlPreview: url.substring(0, 100),
      titleFromSpreadsheet: title,
      imageUrl: imageUrl,
    });

    let imageAsset = null;
    if (imageUrl) {
      try {
        // Initialize image upload
        const uploadInfo = await this.initializeImageUpload();

        // Upload the image
        await this.uploadImage(uploadInfo.uploadUrl, imageUrl);

        // Store the image URN for the post
        imageAsset = uploadInfo.image;

        // Wait for image processing
        await this.waitForImageProcessing(imageAsset);
      } catch (error) {
        console.warn("Failed to process image, continuing with post without image:", error);
      }
    }

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

    // Add image to post if available
    if (imageAsset) {
      // Use article type since we're sharing a blog post
      postData.content = {
        article: {
          source: url,
          thumbnail: imageAsset,
          title: title || "Blog Post",
          description: message.substring(0, 256), // LinkedIn recommends shorter descriptions
        },
      };
    }

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

  // Helper method to wait for image processing
  async waitForImageProcessing(imageUrn, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const encodedUrn = encodeURIComponent(imageUrn);
        const response = await axios.get(`https://api.linkedin.com/rest/images/${encodedUrn}`, {
          headers: this.getHeaders(),
        });

        if (response.data.status === "AVAILABLE") {
          return true;
        }

        if (response.data.status === "PROCESSING_FAILED") {
          throw new Error("Image processing failed");
        }

        // Wait 2 seconds before next attempt
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error checking image status:", error);
        throw error;
      }
    }
    throw new Error("Image processing timeout");
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
      "LinkedIn-Version": "202501",
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };
  }
}

module.exports = LinkedInClient;
