import { WechatyBuilder, Contact, Room, Message } from 'wechaty';
import { ContactImpl } from 'wechaty/impls';
import qrcodeTerminal from 'qrcode-terminal';
import { jobWxBotConfig } from '../package.json';
import { InternJobProvider } from './providers/InternJobProvider';
import { NGJobProvider } from './providers/NGJobProvider';

const wechaty = WechatyBuilder.build();
let targetRooms: Room[] = [];
const internJob = new InternJobProvider();
const newGradJob = new NGJobProvider();
function displayStartupBanner() {
  const banner = `
  ____    __  __    _    _     _     ____   ___ _____
 / ___|  |  \\/  |  / \\  | |   | |   | __ ) / _ \\_   _|
 \\___ \\  | |\\/| | / _ \\ | |   | |   |  _ \\| | | || |  
  ___) | | |  | |/ ___ \\| |___| |___| |_) | |_| || |  
 |____/  |_|  |_/_/   \\_\\_____|_____|____/ \\___/ |_|  
                                                      
`;

  console.log('\x1b[36m%s\x1b[0m', banner); // Cyan color
  console.log('\x1b[33m%s\x1b[0m', '🚀 WX Job Bot is starting up!'); // Yellow color
  console.log(
    '\x1b[32m%s\x1b[0m',
    `📊 Configured to check every ${jobWxBotConfig.minsCheckInterval} minutes`,
  );
  console.log(
    '\x1b[32m%s\x1b[0m',
    `📅 Looking for jobs posted in the last ${jobWxBotConfig.maxDays} days`,
  );
  console.log('\x1b[32m%s\x1b[0m', `💬 Target rooms: ${jobWxBotConfig.rooms.join(', ')}`);
  console.log('\x1b[35m%s\x1b[0m', '🔍 Scanning QR Code to log in...\n');
}

async function sendInternJobUpdates() {
  if (targetRooms.length === 0) {
    console.log('No target rooms set');
    return;
  }
  const newInternJobs = await internJob.getNewJobs();
  if (newInternJobs.length > 0) {
    const messages = internJob.formatJobMessages(newInternJobs);
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

async function sendNGJobUpdates() {
  if (targetRooms.length === 0) {
    console.log('No target rooms set');
    return;
  }
  const newNGJobs = await newGradJob.getNewJobs();
  if (newNGJobs.length > 0) {
    const messages = newGradJob.formatJobMessages(newNGJobs);
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
    console.log('\x1b[36m%s\x1b[0m', `🎉 User ${user} logged in successfully!`); // Cyan color
    const roomPromises = jobWxBotConfig.rooms.map(async (roomName: string) => {
      const room = await wechaty.Room.find({ topic: roomName });
      if (room) {
        console.log('\x1b[32m%s\x1b[0m', `✅ Room "${roomName}" found`); // Green color
        return room;
      } else {
        console.log('\x1b[31m%s\x1b[0m', `❌ Room "${roomName}" not found`); // Red color
        return null;
      }
    });
    const rooms = await Promise.all(roomPromises);
    targetRooms = rooms.filter((room): room is Room => room !== null);
    if (targetRooms.length > 0) {
      console.log(
        '\x1b[36m%s\x1b[0m',
        `🚀 ${targetRooms.length} target room(s) found. Bot is ready!`,
      ); // Cyan color
      setInterval(sendInternJobUpdates, jobWxBotConfig.minsCheckInterval * 60 * 1000);
      setInterval(sendNGJobUpdates, jobWxBotConfig.minsCheckInterval * 60 * 1000);
      await sendInternJobUpdates();
      await sendNGJobUpdates();
    } else {
      console.log('\x1b[31m%s\x1b[0m', '❌ No target rooms found. Bot cannot operate.'); // Red color
    }
  })
  .on('message', async (message: Message) => {
    const mentionSelf = await message.mentionSelf();
    if (mentionSelf) {
      const text = message.text().toLowerCase();
      const command = text.split(' ')[1]; // Get the first word after the mention

      switch (command) {
        case 'intern':
        case 'internjobs':
          if (!(await sendInternJobUpdates())) {
            await message.say('No new jobs found for Intern roles');
          }
          break;
        case 'ng':
        case 'ngjobs':
          if (!(await sendNGJobUpdates())) {
            await message.say('No new jobs found for New Graduate roles');
          }
          break;
        case 'help':
          await message.say(
            'Available commands:\n' +
              '- @BotName intern: Get new intern job postings\n' +
              '- @BotName ng: Get new graduate job postings\n' +
              '- @BotName help: Show this help message',
          );
          break;
        default:
          await message.say('Unrecognized command. Use "@BotName help" for available commands.');
      }
    }
  });

displayStartupBanner();
wechaty.start();
