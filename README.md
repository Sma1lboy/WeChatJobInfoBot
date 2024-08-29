# WeChat Job Bot

[中文版 (Chinese Version)](./README.zh-CN.md)

```
  ____    **  **    *    *     *     *___   ___ _____
 / ___|  |  \/  |  / \  | |   | |   | __ ) / * \*   _|
 \___ \  | |\/| | / * \ | |   | |   |  * \| | | || |
  ___) | | |  | |/ ___ \| |___| |___| |_) | |_| || |
 |____/  |_|  |_/_/   \_\_____|_____|____/ \___/ |_|
```

## Project Overview

WeChat Job Bot is an automated tool designed to share the latest internship and new graduate job opportunities in WeChat groups. The bot periodically fetches the latest job openings from specified sources and sends them to configured WeChat groups.

## Current Features

1. **Automatic Job Fetching**: Regularly retrieves the latest internship and new graduate job postings from specified sources.
2. **Smart Filtering**: Automatically filters out closed job applications.
3. **Information Annotation**: Adds special annotations for positions that don't offer visa sponsorship or require U.S. citizenship.
4. **Scheduled Sending**: Sends new job information to designated WeChat groups at configured intervals.
5. **Manual Trigger**: Allows manual triggering of job information updates by sending specific commands in the group.
6. **Room-Specific Memory**: Maintains separate job history for each WeChat group, ensuring newly added rooms don't miss out on previous job posts.
7. **Daily Summary**: Provides a daily summary of all job postings for each job type.
8. **Modular Design**: Supports easy addition of new job providers through a modular architecture.
9. **Google Sheets Integration**: Allows backing up job data to Google Sheets (optional plugin).

## Future Plans

1. **Advanced Filtering**: Allow users to set more filtering conditions, such as company, job type, etc.
2. **Personalized Push**: Push job information based on user interests and skill match.
3. **Admin User**: Add admin users who can use super commands without restarting the bot.
4. **Auto Update**: Add automatic checking for bot updates and update without manual server operations.
5. **Multi-language Support**: Extend support for multiple languages in job postings and bot interactions.
6. **Analytics Dashboard**: Implement a web dashboard for viewing job posting statistics and bot performance.
7. **Support Plugin**: allow adding plugin to this bot.

## Configuration

The project is configured using the `jobWxBotConfig` section in `package.json`. Here are the main configuration items:

```json
"jobWxBotConfig": {
  "maxDays": 2,
  "jobsPerMessage": 3,
  "minsCheckInterval": 5,
  "rooms": [
    "TestBot"
  ],
  "googleSheet": false
}
```

- `maxDays`: Number of recent days to fetch job postings for (default: 2 days)
- `jobsPerMessage`: Maximum number of jobs to include in each message (default: 3)
- `minsCheckInterval`: Time interval for checking new jobs, in minutes (default: 5 minutes)
- `rooms`: List of WeChat group names to send job information to
- `googleSheet`: Enable or disable the Google Sheets plugin (default: false)

## Usage Instructions

1. Clone the repository:

   ```
   git clone https://github.com/your-username/wechat-job-bot.git
   ```

2. Navigate to the project directory:

   ```
   cd wechat-job-bot
   ```

3. Install dependencies:

   ```
   yarn
   ```

4. Configure `jobWxBotConfig` in `package.json` according to your needs.

5. Start the bot:

   ```
   yarn start
   ```

6. Scan the displayed QR code to log into WeChat.

7. The bot will automatically start sharing job information in the configured groups.

## Available Commands

- `@BOT intern`: Get new intern job postings
- `@BOT ng`: Get new graduate job postings
- `@BOT help`: Show all available commands
- `@BOT intern-daily`: Get a summary of internship positions posted in the last 24 hours
- `@BOT ng-daily`: Get a summary of new graduate positions posted in the last 24 hours
- `@BOT add-this`: Add the current room to the bot's target list (admin only)
- `@BOT sheet`: Trigger a backup of the current job data to the configured Google Sheet (requires Google Sheets plugin)

## Google Sheets Plugin

The WeChat Job Bot now supports backing up job data to Google Sheets. This feature can be enabled through the configuration in `package.json`.

### Enabling the Google Sheets Plugin

To enable the Google Sheets plugin, set the `googleSheet` option to `true` in the `jobWxBotConfig` section of your `package.json`:

```json
"jobWxBotConfig": {
  ...
  "googleSheet": true
}
```

### Configuration

The Google Sheets plugin requires the following environment variables:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The email address of your Google Service Account
- `GOOGLE_PRIVATE_KEY`: The private key of your Google Service Account
- `GOOGLE_SHEET_ID`: The ID of the Google Sheet where data will be backed up

Make sure to set these environment variables before running the bot.

### Setup Instructions

1. Create a Google Cloud Project and enable the Google Sheets API.
2. Create a Service Account and download the JSON key file.
3. Create a new Google Sheet and share it with the email address of your Service Account.
4. Set the required environment variables:
   ```
   export GOOGLE_SERVICE_ACCOUNT_EMAIL='your-service-account@your-project.iam.gserviceaccount.com'
   export GOOGLE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n'
   export GOOGLE_SHEET_ID='your-google-sheet-id'
   ```
5. Enable the plugin in `package.json` by setting `"googleSheet": true`.

Now, when you run the bot, it will be able to backup job data to your Google Sheet when the `@BOT sheet` command is used.

## Contributing

We welcome contributions to improve this project! If you're interested in adding new features, fixing bugs, or enhancing the bot in any way, please check out our [CONTRIBUTING.md](CONTRIBUTING.md) file. It contains detailed information on how to contribute, including how to add new job providers.

If you have any suggestions or find a bug, please create an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
