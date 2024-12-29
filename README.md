# uiFromMars' Autoposter

> You do not rise to the level of your goals. You fall to the level of your systems.  
> — James Clear

## Basic Overview

I've posted over 260 articles on [uiFromMars](https://www.uifrommars.com/). Despite doing well with SEO, I also share them on social networks. I don't want to manually schedule the posts, so that's why I ended up creating this "Autoposter.

## How Does This Work?

- It uses Twitter (X) and LinkedIn's APIs to fetch post links from a Google Spreadsheet and then posts them at five different intervals during the day.
- The Spreadsheet contains 110 posts, each with two different messages. If something has been posted in the last 30 days, it won't be posted again.
- It uses Netlify Scheduled Functions.
- A Telegram bot allows me to check whether something has been posted (or not).

## How-To

You need to set up an `.env` file to store all the variables required for this to work. Here's an example:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_ACCESS_TOKEN=
GOOGLE_REFRESH_TOKEN=
GOOGLE_SHEET_ID=

TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

LINKEDIN_USER_ID=
LINKEDIN_ACCESS_TOKEN=

ENABLE_TWITTER=true / false
ENABLE_LINKEDIN=true / false

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## Pending

- Enhance LinkedIn's thumbnail preview.
- Potentially create a WordPress plugin to skip the Spreadsheet step.
