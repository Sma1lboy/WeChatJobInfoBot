import { WechatyBuilder, Contact, Room, Message } from 'wechaty';
import { ContactImpl } from 'wechaty/impls';
import qrcodeTerminal from 'qrcode-terminal';
import { jobWxBotConfig } from '../package.json';
import { InternJobProvider } from './providers/InternJobProvider';
import { NGJobProvider } from './providers/NGJobProvider';
import path from 'path';
import os from 'os';
import * as fs from 'fs';
import { TopicsLocal } from './types';
import { CommandHandler } from './commandHandler';

const wechaty = WechatyBuilder.build();
let targetRooms: Room[] = [];
const internJob = new InternJobProvider(jobWxBotConfig);
const newGradJob = new NGJobProvider(jobWxBotConfig);

const homeDir = os.homedir();
const configDir = path.join(homeDir, '.job-wx-bot');
const registeredTopicsPath = path.join(configDir, 'registered-topics.json');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

function displayStartupBanner() {
  const banner = `
  ____    __  __    _    _     _     ____   ___ _____
 / ___|  |  \\/  |  / \\  | |   | |   | __ ) / _ \\_   _|
 \\___ \\  | |\\/| | / _ \\ | |   | |   |  _ \\| | | || |  
  ___) | | |  | |/ ___ \\| |___| |___| |_) | |_| || |  
 |____/  |_|  |_/_/   \\_\\_____|_____|____/ \\___/ |_|  
                                                      
`;

  console.log('\x1b[36m%s\x1b[0m', banner);
  console.log('\x1b[33m%s\x1b[0m', '🚀 WX Job Bot is starting up!');
  console.log(
    '\x1b[32m%s\x1b[0m',
    `📊 Configured to check every ${jobWxBotConfig.minsCheckInterval} minutes`,
  );
  console.log(
    '\x1b[32m%s\x1b[0m',
    `📅 Looking for jobs posted in the last ${jobWxBotConfig.maxDays} days`,
  );
}

async function updateRegisteredTopics(validRooms: Room[]) {
  const validTopics: TopicsLocal = {
    topics: await Promise.all(validRooms.map(async (room) => await room.topic())),
  };
  fs.writeFileSync(registeredTopicsPath, JSON.stringify(validTopics, null, 2));
}

async function getTargetRooms(): Promise<Room[]> {
  let roomTopics = new Set(jobWxBotConfig.rooms);

  if (fs.existsSync(registeredTopicsPath)) {
    const data = fs.readFileSync(registeredTopicsPath, 'utf8');
    const topicsLocal: TopicsLocal = JSON.parse(data);
    if (topicsLocal.topics) topicsLocal.topics.forEach((topic: string) => roomTopics.add(topic));
  }

  const roomPromises = Array.from(roomTopics).map(async (roomName: string) => {
    const room = await wechaty.Room.find({ topic: roomName });
    if (room) {
      console.log('\x1b[32m%s\x1b[0m', `✅ Room "${roomName}" found`);
      return room;
    } else {
      console.log('\x1b[31m%s\x1b[0m', `❌ Room "${roomName}" not found`);
      return null;
    }
  });

  const rooms = await Promise.all(roomPromises);
  const validRooms = rooms.filter((room): room is Room => room !== null);

  await updateRegisteredTopics(validRooms);

  return validRooms;
}

let commandHandler: CommandHandler;

wechaty
  .on('scan', (qrcodeUrl: string, status) => {
    console.log(qrcodeTerminal.generate(qrcodeUrl, { small: true }));
  })
  .on('login', async (user: ContactImpl) => {
    console.log('\x1b[36m%s\x1b[0m', `🎉 User ${user} logged in successfully!`);

    targetRooms = await getTargetRooms();
    commandHandler = new CommandHandler(internJob, newGradJob, targetRooms);

    if (targetRooms.length > 0) {
      console.log(
        '\x1b[36m%s\x1b[0m',
        `🚀 ${targetRooms.length} target room(s) found. Bot is ready!`,
      );
      setInterval(
        () => commandHandler.handleCommand({ command: 'intern' } as any),
        jobWxBotConfig.minsCheckInterval * 60 * 1000,
      );
      setInterval(
        () => commandHandler.handleCommand({ command: 'ng' } as any),
        jobWxBotConfig.minsCheckInterval * 60 * 1000,
      );
      await commandHandler.handleCommand({ command: 'intern' } as any);
      await commandHandler.handleCommand({ command: 'ng' } as any);
    } else {
      console.log('\x1b[31m%s\x1b[0m', '❌ No target rooms found. Bot cannot operate.');
    }
  })
  .on('message', async (message: Message) => {
    const mentionSelf = await message.mentionSelf();
    if (mentionSelf) {
      await commandHandler.handleCommand(message);
    }
  });

displayStartupBanner();
wechaty.start();
