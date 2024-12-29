# uiFromMars' Autoposter

> You do not rise to the level of your goals. You fall to the level of your systems.  
> — James Clear

## Basic Overview

I've posted over 260 articles on [uiFromMars](https://www.uifrommars.com/). Despite doing well with SEO, I also share them on social networks. I don't want to manually schedule the posts, so that's why I ended up creating this "Autoposter."

## How Does This Work?

- It uses Twitter (X) and LinkedIn's APIs to fetch post links from a Google Spreadsheet and then posts them at five different intervals during the day.
- The Spreadsheet contains 110 posts, each with two different messages. If something has been posted in the last 30 days, it won't be posted again.
- It uses Netlify Scheduled Functions.
- A Telegram bot allows me to check whether something has been posted (or not).

## Next Steps

- Enhance LinkedIn's thumbnail preview.
- Potentially create a WordPress plugin to skip the Spreadsheet step.
