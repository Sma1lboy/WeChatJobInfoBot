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

const wechaty = WechatyBuilder.build();
let targetRooms: Room[] = [];
const internJob = new InternJobProvider();
const newGradJob = new NGJobProvider();

const homeDir = os.homedir();
const configDir = path.join(homeDir, '.job-wx-bot');
const registeredTopicsPath = path.join(configDir, 'registered-topics.json');

// Ensure the config directory exists
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
}

async function sendJobUpdates(provider: InternJobProvider | NGJobProvider) {
  console.log(`Checking for new ${provider.jobType} jobs... now !`);
  if (targetRooms.length === 0) {
    console.log('No target rooms set');
    return false;
  }
  const newJobs = await provider.getNewJobs();
  if (newJobs.length > 0) {
    const messages = provider.formatJobMessages(newJobs);
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

async function isRoomOwnerOrAdmin(room: Room, contact: Contact): Promise<boolean> {
  const roomOwner = await room.owner();
  console.log('Room:', room);
  console.log('Room owner:', roomOwner);
  console.log('Contact:', contact);
  return roomOwner ? roomOwner.id === contact.id : false;
}

async function addRoomToRegistry(roomTopic: string) {
  let topicsLocal: TopicsLocal = { topics: [] };

  if (fs.existsSync(registeredTopicsPath)) {
    const data = fs.readFileSync(registeredTopicsPath, 'utf8');
    topicsLocal = JSON.parse(data);
  }

  if (!topicsLocal.topics.includes(roomTopic)) {
    topicsLocal.topics.push(roomTopic);
    fs.writeFileSync(registeredTopicsPath, JSON.stringify(topicsLocal, null, 2));
    console.log(`Added room "${roomTopic}" to the registry.`);
  } else {
    console.log(`Room "${roomTopic}" is already in the registry.`);
  }
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
      console.log('\x1b[32m%s\x1b[0m', `✅ Room "${roomName}" found`); // Green color
      return room;
    } else {
      console.log('\x1b[31m%s\x1b[0m', `❌ Room "${roomName}" not found`); // Red color
      return null;
    }
  });

  const rooms = await Promise.all(roomPromises);
  const validRooms = rooms.filter((room): room is Room => room !== null);

  // Update the registered topics file with only valid rooms
  await updateRegisteredTopics(validRooms);

  return validRooms;
}

wechaty
  .on('scan', (qrcodeUrl: string, status) => {
    console.log(qrcodeTerminal.generate(qrcodeUrl, { small: true }));
  })
  .on('login', async (user: ContactImpl) => {
    console.log('\x1b[36m%s\x1b[0m', `🎉 User ${user} logged in successfully!`); // Cyan color

    targetRooms = await getTargetRooms();

    if (targetRooms.length > 0) {
      console.log(
        '\x1b[36m%s\x1b[0m',
        `🚀 ${targetRooms.length} target room(s) found. Bot is ready!`,
      ); // Cyan color
      setInterval(() => sendJobUpdates(internJob), jobWxBotConfig.minsCheckInterval * 60 * 1000);
      setInterval(() => sendJobUpdates(newGradJob), jobWxBotConfig.minsCheckInterval * 60 * 1000);
      await sendJobUpdates(internJob);
      await sendJobUpdates(newGradJob);
    } else {
      console.log('\x1b[31m%s\x1b[0m', '❌ No target rooms found. Bot cannot operate.'); // Red color
    }
  })
  .on('message', async (message: Message) => {
    const mentionSelf = await message.mentionSelf();
    if (mentionSelf) {
      const room = message.room();
      const sender = message.talker();
      const text = message.text().toLowerCase();
      // Improved command parsing
      const commandMatch = text.match(/@\S+\s+(.+)/);
      const command = commandMatch ? commandMatch[1].toLowerCase() : '';

      console.log('Received command:', command);

      if (room && sender) {
        switch (command) {
          case 'add-this':
            if (await isRoomOwnerOrAdmin(room, sender)) {
              const roomTopic = await room.topic();
              await addRoomToRegistry(roomTopic);
              targetRooms = await getTargetRooms();
              await message.say(`Room "${roomTopic}" has been added to the bot's target list.`);
            } else {
              await message.say(
                "Sorry, only room owners or admins can add rooms to the bot's target list.",
              );
            }
            break;
          case 'intern':
          case 'internjobs':
            if (!(await sendJobUpdates(internJob))) {
              await message.say('No new jobs found for Intern roles');
            }
            break;
          case 'ng':
          case 'ngjobs':
            if (!(await sendJobUpdates(newGradJob))) {
              await message.say('No new jobs found for New Graduate roles');
            }
            break;
          case 'help':
            await message.say(
              'Available commands:\n' +
                '- @BOT intern: Get new intern job postings\n' +
                '- @BOT ng: Get new graduate job postings\n' +
                "- @BOT add-this: Add this room to the bot's target list (admin only)\n" +
                '- @BOT help: Show this help message',
            );
            break;
          default:
            await message.say('Unrecognized command. Use "@BOT help" for available commands.');
        }
      }
    }
  });

displayStartupBanner();
wechaty.start();
