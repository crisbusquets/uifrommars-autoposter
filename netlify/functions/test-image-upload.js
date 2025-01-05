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
    const { imageUrl } = JSON.parse(event.body);

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "imageUrl is required in request body" }),
      };
    }

    const linkedInClient = new LinkedInClient();

    // Test token verification
    const isTokenValid = await linkedInClient.verifyToken();
    console.log("Token verification result:", isTokenValid);

    // Initialize upload
    console.log("Initializing image upload...");
    const uploadInfo = await linkedInClient.initializeImageUpload();
    console.log("Upload info:", uploadInfo);

    // Upload image
    console.log("Uploading image...");
    await linkedInClient.uploadImage(uploadInfo.uploadUrl, imageUrl);
    console.log("Image uploaded successfully");

    // Wait for processing
    console.log("Waiting for image processing...");
    await linkedInClient.waitForImageProcessing(uploadInfo.image);
    console.log("Image processing completed");

    // Create test post with image
    const testPost = await linkedInClient.post(
      "Test post with image - " + new Date().toISOString(),
      "https://example.com",
      "Test Title",
      imageUrl
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
        imageUrn: uploadInfo.image,
        postId: testPost.id,
      }),
    };
  } catch (error) {
    console.error("Error in test endpoint:", {
      message: error.message,
      status: error.status,
      responseData: error.response?.data,
      stack: error.stack,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || error.stack,
      }),
    };
  }
};
