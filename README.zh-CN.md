# 微信求职机器人

[中文版 (Chinese Version)](./README.zh-CN.md)

      ____    **  **    *    *     *     *___   ___ _____
     / ___|  |  \/  |  / \  | |   | |   | __ ) / * \*   _|
     \___ \  | |\/| | / * \ | |   | |   |  * \| | | || |
      ___) | | |  | |/ ___ \| |___| |___| |_) | |_| || |
     |____/  |_|  |_/_/   \_\_____|_____|____/ \___/ |_|

## 项目概况

微信求职机器人是一款自动化工具，旨在在微信群中分享最新的实习和应届毕业生的工作机会。该机器人定期从指定来源获取最新的职位空缺，并将其发送到配置的微信群组。

## 目前的特点

1.  **自动获取工作**：定期从指定来源检索最新的实习和应届毕业生的职位发布。
2.  **智能过滤**：自动过滤掉已关闭的职位申请。
3.  **信息标注**：为不提供签证赞助或需要美国公民身份的职位添加特殊注释。
4.  **预定发送**：按照设定的时间间隔向指定的微信群发送新的职位信息。
5.  **手动触发**：允许通过在群组中发送特定命令来手动触发作业信息更新。
6.  **房间特定内存**：为每个微信群维护单独的工作记录，确保新添加的房间不会错过以前的工作岗位。
7.  **每日总结**：提供每种职位类型的所有职位发布的每日摘要。
8.  **模块化设计**：支持通过模块化架构轻松添加新的工作提供者。
9.  **谷歌表格集成**：允许将作业数据备份到 Google Sheets（可选插件）。

## 未来计划

1.  **高级过滤**：允许用户设置更多过滤条件，如公司、职位类型等。
2.  **个性化推送**：根据用户兴趣和技能匹配推送职位信息。
3.  **管理员用户**：添加管理员用户，无需重启机器人即可使用超级命令。
4.  **自动更新**：添加自动检查机器人更新并更新，无需手动服务器操作。
5.  **多语言支持**：扩展对职位发布和机器人交互中多种语言的支持。
6.  **分析仪表板**：实施一个网络仪表板来查看职位发布统计数据和机器人性能。
7.  **支持插件**：允许向该机器人添加插件。

## 配置

该项目配置使用`jobWxBotConfig`部分在`package.json`。以下是主要配置项：

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

-   `maxDays`：最近获取职位发布的天数（默认值：2 天）
-   `jobsPerMessage`：每条消息中包含的最大作业数（默认值：3）
-   `minsCheckInterval`：检查新作业的时间间隔，单位为分钟（默认：5分钟）
-   `rooms`：发送职位信息的微信群名列表
-   `googleSheet`：启用或禁用 Google Sheets 插件（默认值： false）

## 使用说明

1.  克隆存储库：

        git clone https://github.com/your-username/wechat-job-bot.git

2.  导航到项目目录：

        cd wechat-job-bot

3.  安装依赖项：

        yarn

4.  配置`jobWxBotConfig`在`package.json`根据您的需要。

5.  启动机器人：

        yarn start

6.  扫描显示的二维码即可登录微信。

7.  机器人将自动开始在配置的组中共享作业信息。

## 可用命令

-   `@BOT intern`：获取新的实习生职位信息
-   `@BOT ng`：获取新的毕业生职位信息
-   `@BOT help`：显示所有可用命令
-   `@BOT intern-daily`：获取过去 24 小时内发布的实习职位摘要
-   `@BOT ng-daily`：获取过去 24 小时内发布的新毕业生职位的摘要
-   `@BOT add-this`：将当前房间添加到机器人的目标列表中（仅限管理员）
-   `@BOT sheet`：触发​​将当前作业数据备份到配置的Google Sheets（需要Google Sheets插件）

## 谷歌表格插件

微信求职机器人现在支持将职位数据备份到 Google Sheets。可以通过以下配置启用此功能`package.json`.

### 启用 Google 表格插件

要启用 Google 表格插件，请设置`googleSheet`选项`true`在`jobWxBotConfig`你的部分`package.json`:

```json
"jobWxBotConfig": {
  ...
  "googleSheet": true
}
```

### 配置

Google Sheets 插件需要以下环境变量：

-   `GOOGLE_SERVICE_ACCOUNT_EMAIL`：您的 Google 服务帐户的电子邮件地址
-   `GOOGLE_PRIVATE_KEY`：您的 Google 服务帐户的私钥
-   `GOOGLE_SHEET_ID`：要备份数据的Google Sheet的ID

确保在运行机器人之前设置这些环境变量。

### 设置说明

1.  创建 Google Cloud 项目并启用 Google Sheets API。
2.  创建服务帐户并下载 JSON 密钥文件。
3.  创建一个新的 Google 表格并使用您服务帐户的电子邮件地址进行共享。
4.  设置所需的环境变量：
        export GOOGLE_SERVICE_ACCOUNT_EMAIL='your-service-account@your-project.iam.gserviceaccount.com'
        export GOOGLE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n'
        export GOOGLE_SHEET_ID='your-google-sheet-id'
5.  启用该插件`package.json`通过设置`"googleSheet": true`.

现在，当您运行机器人时，它将能够将作业数据备份到您的 Google Sheet`@BOT sheet`使用命令。

## 贡献

我们欢迎为改进这个项目做出贡献！如果您有兴趣添加新功能、修复错误或以任何方式增强机器人，请查看我们的[CONTRIBUTING.md](CONTRIBUTING.md)文件。它包含有关如何做出贡献的详细信息，包括如何添加新的工作提供者。

如果您有任何建议或发现错误，请创建问题。

## 执照

该项目已获得 MIT 许可证 - 请参阅[执照](./LICENSE)文件以获取详细信息。
