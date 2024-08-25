# WeChat Job Bot

[中文版 (Chinese Version)](./readme-zh-CN.md)

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
  ]
}
```

- `maxDays`: Number of recent days to fetch job postings for (default: 2 days)
- `jobsPerMessage`: Maximum number of jobs to include in each message (default: 3)
- `minsCheckInterval`: Time interval for checking new jobs, in minutes (default: 5 minutes)
- `rooms`: List of WeChat group names to send job information to

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

## Contributing

We welcome contributions to improve this project! If you're interested in adding new features, fixing bugs, or enhancing the bot in any way, please check out our [CONTRIBUTING.md](CONTRIBUTING.md) file. It contains detailed information on how to contribute, including how to add new job providers.

If you have any suggestions or find a bug, please create an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
