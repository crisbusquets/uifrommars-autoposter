exports.handler = async function (event, context) {
  // Return the Netlify identity token
  return {
    statusCode: 200,
    body: JSON.stringify({
      access_token: context.clientContext.identity.token,
    }),
  };
};
