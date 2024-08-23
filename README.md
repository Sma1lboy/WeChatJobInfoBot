# WeChat Job Bot

[中文版 (Chinese Version)](./readme-zh-CN.md)

## Project Overview

WeChat Job Bot is an automated tool designed to share the latest internship and new graduate job opportunities in WeChat groups. The bot periodically fetches the latest job openings from a specified source and sends them to configured WeChat groups.

```
  ____    __  __    _    _     _     ____   ___ _____
 / ___|  |  \/  |  / \  | |   | |   | __ ) / _ \_   _|
 \___ \  | |\/| | / _ \ | |   | |   |  _ \| | | || |
  ___) | | |  | |/ ___ \| |___| |___| |_) | |_| || |
 |____/  |_|  |_/_/   \_\_____|_____|____/ \___/ |_|
```

## Current Features

1. **Automatic Job Fetching**: Regularly retrieves the latest internship and new graduate job postings from a specified source.
2. **Smart Filtering**: Automatically filters out closed job applications.
3. **Information Annotation**: Adds special annotations for positions that don't offer visa sponsorship or require U.S. citizenship.
4. **Scheduled Sending**: Sends new job information to designated WeChat groups at configured intervals.
5. **Manual Trigger**: Allows manual triggering of job information updates by sending a "jobs" command in the group.

## Future Plans

1. **Command Module**: Plans to add more commands to enhance the bot's interactivity and functionality.
2. **Debug Mode**: Will introduce a debug mode to facilitate testing and troubleshooting for developers.
3. **Advanced Filtering**: Allow users to set more filtering conditions, such as company, job type, etc.
4. **Personalized Push**: Push job information based on user interests and skill match.
5. **Admin User**: Adding admin user that could using some super command without restart bot every time
6. **Auto update**: Adding auto check bot update information and update automatically without doing operation on server

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

1. Ensure all necessary dependencies are installed.
2. Configure `jobWxBotConfig` in `package.json`.
3. Run the bot:
   ```
   npm start
   ```
4. Scan the displayed QR code to log into WeChat.
5. The bot will automatically start sharing job information in the configured groups.

## Contributing

Pull requests are welcome to improve this project. If you have any suggestions or find a bug, please create an issue.

## License

[MIT](./LICENSE)
