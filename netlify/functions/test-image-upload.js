// netlify/functions/test-image-upload.js
require("dotenv").config();
const LinkedInClient = require("./lib/linkedin.js");

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { imageUrl, message } = JSON.parse(event.body);

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "imageUrl is required in request body" }),
      };
    }

    const linkedInClient = new LinkedInClient();
    console.log("=== Starting LinkedIn Image Upload Test ===");

    // Test token verification
    console.log("1. Verifying LinkedIn token...");
    const isTokenValid = await linkedInClient.verifyToken();
    console.log("Token valid:", isTokenValid);

    // Initialize upload
    console.log("\n2. Initializing image upload...");
    const uploadInfo = await linkedInClient.initializeImageUpload();
    console.log("Upload initialized:", {
      uploadUrl: uploadInfo.uploadUrl,
      imageUrn: uploadInfo.image,
    });

    // Upload image
    console.log("\n3. Uploading image...");
    await linkedInClient.uploadImage(uploadInfo.uploadUrl, imageUrl);
    console.log("Image uploaded successfully");

    // Wait for processing
    console.log("\n4. Waiting for image processing...");
    await linkedInClient.waitForImageProcessing(uploadInfo.image);
    console.log("Image processing completed");

    // Create test post with image
    console.log("\n5. Creating test post...");
    const testPost = await linkedInClient.post(
      message || `Test post with updated image handling - ${new Date().toISOString()}`,
      "https://example.com",
      "Test Title with Enhanced Image",
      imageUrl
    );
    console.log("Post created successfully:", testPost);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
        imageUrn: uploadInfo.image,
        postId: testPost.id,
        steps: {
          tokenVerification: "Success",
          imageUpload: "Success",
          imageProcessing: "Success",
          postCreation: "Success",
        },
      }),
    };
  } catch (error) {
    console.error("Error in test endpoint:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};
