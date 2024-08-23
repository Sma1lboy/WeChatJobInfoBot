import { WechatyBuilder, Contact, Room, Message } from 'wechaty';
import { ContactImpl } from 'wechaty/impls';
import qrcodeTerminal from 'qrcode-terminal';
import { InternJobProvider, Job } from './intern-job-provider';

const wechaty = WechatyBuilder.build();
let targetRoom: Room | null = null;
const jobProvider = new InternJobProvider();

async function sendJobUpdates() {
  if (!targetRoom) {
    console.log('Target room not set');
    return;
  }

  const newJobs = await jobProvider.getNewJobs();

  if (newJobs.length > 0) {
    const messages = jobProvider.formatJobMessages(newJobs);
    for (const message of messages) {
      await targetRoom.say(message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
    targetRoom = (await wechaty.Room.find({ topic: '测试bot' })) || null;
    if (targetRoom) {
      console.log('Target room found');
      setInterval(sendJobUpdates, 24 * 60 * 60 * 1000);
      sendJobUpdates();
    } else {
      console.log('Target room not found');
    }
  })
  .on('message', async (message: Message) => {
    console.log(`Message received: ${message.text()}`);
    if (message.text().toLowerCase() === 'jobs') {
      if (!(await sendJobUpdates())) {
        message.say('No new jobs found for Intern/NG roles');
      }
    }
  });

wechaty.start();
