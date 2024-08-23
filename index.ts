import { WechatyBuilder } from "wechaty";

const wechaty = WechatyBuilder.build(); // get a Wechaty instance
wechaty
  .on("scan", (qrcode, status) =>
    console.log(
      `Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(
        qrcode
      )}`
    )
  )
  .on("login", (user) => console.log(`User ${user} logged in`))
  .on("message", (message) => console.log(`Message: ${message}`));
wechaty.start();
