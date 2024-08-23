import { WechatyBuilder, Contact, Room, Message } from 'wechaty';
import { ContactImpl } from 'wechaty/impls';
import qrcodeTerminal from 'qrcode-terminal';
import { InternJobProvider, Job } from './intern-job-provider';
import { jobWxBotConfig } from '../package.json';

const wechaty = WechatyBuilder.build();
let targetRooms: Room[] = [];
const jobProvider = new InternJobProvider();

async function sendJobUpdates() {
  if (targetRooms.length === 0) {
    console.log('No target rooms set');
    return;
  }

  const newJobs = await jobProvider.getNewJobs();

  if (newJobs.length > 0) {
    const messages = jobProvider.formatJobMessages(newJobs);
    for (const room of targetRooms) {
      for (const message of messages) {
        await room.say(message);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return true;
  } else {
    console.log('No new jobs found');
    return false;
  }
}

wechaty
  .on('scan', (qrcodeUrl: string, status) => {
    console.log(qrcodeTerminal.generate(qrcodeUrl, { small: true }));
  })
  .on('login', async (user: ContactImpl) => {
    console.log(`User ${user} logged in`);
    const roomPromises = jobWxBotConfig.rooms.map(async (roomName: string) => {
      const room = await wechaty.Room.find({ topic: roomName });
      if (room) {
        console.log(`Room "${roomName}" found`);
        return room;
      } else {
        console.log(`Room "${roomName}" not found`);
        return null;
      }
    });

    const rooms = await Promise.all(roomPromises);
    targetRooms = rooms.filter((room): room is Room => room !== null);

    if (targetRooms.length > 0) {
      console.log(`${targetRooms.length} target room(s) found`);
      setInterval(sendJobUpdates, jobWxBotConfig.minsCheckInterval * 60 * 1000);
      sendJobUpdates();
    } else {
      console.log('No target rooms found');
    }
  })
  .on('message', async (message: Message) => {
    //TODO 需要指令模块
    if (message.text().toLowerCase() === 'jobs') {
      if (!(await sendJobUpdates())) {
        message.say('No new jobs found for Intern/NG roles');
      }
    }
  });

wechaty.start();
