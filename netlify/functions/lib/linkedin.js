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

  async getFullResolutionUrl(imageUrl) {
    try {
      // Try to parse the URL and path
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/");
      const filename = pathParts[pathParts.length - 1];
      const uploadDir = pathParts[pathParts.length - 2];

      // If it's in the wp-content/uploads directory and has a date-based structure
      if (url.pathname.includes("/wp-content/uploads/") && uploadDir.match(/^\d{4}/)) {
        // Remove any existing size suffix (e.g., -300x200)
        const baseFilename = filename.replace(/-\d+x\d+(?=\.[^.]+$)/, "");

        // Construct the full resolution URL
        pathParts[pathParts.length - 1] = baseFilename;
        const fullResUrl = `${url.protocol}//${url.host}${pathParts.join("/")}`;

        console.log("Using full resolution URL:", fullResUrl);
        return fullResUrl;
      }

      return imageUrl; // Return original if not a WordPress media URL
    } catch (error) {
      console.warn("Error parsing image URL, using original:", error);
      return imageUrl;
    }
  }

  async uploadImage(imageUrl) {
    if (!imageUrl) {
      console.log("No image URL provided, skipping image upload");
      return null;
    }

    try {
      console.log("Starting image upload process for:", imageUrl);

      // Get the full resolution URL
      const fullResUrl = await this.getFullResolutionUrl(imageUrl);
      console.log("Full resolution URL:", fullResUrl);

      // Validate the image URL is from uifrommars.com
      if (!fullResUrl.includes("uifrommars.com")) {
        console.warn("Image URL is not from uifrommars.com domain, skipping:", fullResUrl);
        return null;
      }

      // Step 1: Initialize the upload using the new Images API
      const initializeResponse = await axios.post(
        "https://api.linkedin.com/rest/images?action=initializeUpload",
        {
          initializeUploadRequest: {
            owner: `urn:li:person:${String(process.env.LINKEDIN_USER_ID)}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            "LinkedIn-Version": "202411",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Upload initialization response:", initializeResponse.data);

      // Get the upload URL and image URN from the response
      const { uploadUrl, image: imageUrn } = initializeResponse.data.value;

      // Step 2: First get the image metadata and validate size
      const metadataResponse = await axios.head(fullResUrl, {
        headers: {
          "User-Agent": "UIFromMars-Autoposter/1.0",
        },
      });

      // Log content type and other metadata
      const contentLength = parseInt(metadataResponse.headers["content-length"] || "0", 10);
      console.log("Image metadata:", {
        contentType: metadataResponse.headers["content-type"],
        contentLength,
        sizeInMB: (contentLength / (1024 * 1024)).toFixed(2) + " MB",
        dimensions: metadataResponse.headers["content-dimensions"] || "Not provided",
      });

      // Download the image
      const imageResponse = await axios.get(fullResUrl, {
        responseType: "arraybuffer",
        headers: {
          Accept: "image/*",
          "User-Agent": "UIFromMars-Autoposter/1.0",
          "Cache-Control": "no-cache",
        },
        maxContentLength: 5 * 1024 * 1024, // 5MB limit for LinkedIn
      });

      // Log image size for debugging
      const imageSize = imageResponse.data.length;
      console.log(`Image size: ${(imageSize / 1024 / 1024).toFixed(2)}MB`);

      // Step 3: Upload the image binary using the provided upload URL
      await axios.put(uploadUrl, imageResponse.data, {
        headers: {
          "Content-Type": metadataResponse.headers["content-type"] || "application/octet-stream",
        },
      });

      console.log("Image upload completed. Image URN:", imageUrn);
      return imageUrn;
    } catch (error) {
      console.error("Error in image upload process:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
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

    // Handle the OG image upload
    let thumbnailUrn = null;
    if (ogImage) {
      try {
        thumbnailUrn = await this.uploadImage(ogImage);
        if (thumbnailUrn) {
          console.log("Successfully uploaded thumbnail:", thumbnailUrn);
        } else {
          console.log("Skipped thumbnail upload - invalid or missing image URL");
        }
      } catch (error) {
        console.warn("Failed to upload thumbnail, continuing without it:", {
          error: error.message,
          ogImage,
        });
      }
    } else {
      console.log("No OG image URL provided in spreadsheet");
    }

    const postData = {
      author: `urn:li:person:${String(process.env.LINKEDIN_USER_ID)}`,
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
          thumbnail: thumbnailUrn,
        },
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    try {
      const response = await axios.post("https://api.linkedin.com/rest/posts", postData, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          "LinkedIn-Version": "202411",
          "Content-Type": "application/json",
        },
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

      throw new Error(errorMessage);
    }
  }
}

module.exports = LinkedInClient;
