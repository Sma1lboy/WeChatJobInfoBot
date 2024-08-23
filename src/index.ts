import { WechatyBuilder } from 'wechaty';
import { ContactImpl } from 'wechaty/impls';

const wechaty = WechatyBuilder.build(); // get a Wechaty instance

wechaty
  .on('scan', (qrcode, status) => {
    console.log(`Scan QR Code to login: ${status}`);

    const qrcodeImageUrl = [
      'https://api.qrserver.com/v1/create-qr-code/?data=',
      encodeURIComponent(qrcode),
      '&size=220x220&margin=20',
    ].join('');
    console.log('QR Code Image URL:', qrcodeImageUrl);
  })
  .on('login', (user: ContactImpl) => console.log(`User ${user} logged in`))
  .on('message', (message) => {
    console.log(`Message received: ${message}`);
  });

wechaty.start();
