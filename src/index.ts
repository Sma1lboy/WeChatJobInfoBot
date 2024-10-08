import { WechatyBuilder, Contact, Room, Message, ScanStatus, log } from 'wechaty';
import { ContactImpl } from 'wechaty/impls';
import qrcodeTerminal from 'qrcode-terminal';
import { jobWxBotConfig } from '../package.json';
import { InternshipJobProvider } from './providers/internship-job-provider';
import { NewGraduateJobProvider } from './providers/new-graduate-job-provider';
import { FileSystemService } from './file-system-service';
import { BaseCacheFileNames, JobProvider, TopicsLocal } from './types';
import { CommandHandler } from './command-handler';
import cron from 'node-cron';

const wechaty = WechatyBuilder.build();
let targetRooms: Room[] = [];

const jobProviders: JobProvider[] = [
  new InternshipJobProvider(jobWxBotConfig),
  new NewGraduateJobProvider(jobWxBotConfig),
];

// Initialize FileSystemService
FileSystemService.initialize();

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
  FileSystemService.writeBaseJSON(BaseCacheFileNames.REGISTERED_TOPICS, validTopics);
}

async function getTargetRooms(): Promise<Room[]> {
  let roomTopics = new Set(jobWxBotConfig.rooms);

  if (FileSystemService.baseFileExists(BaseCacheFileNames.REGISTERED_TOPICS)) {
    const topicsLocal = FileSystemService.readBaseJSON<TopicsLocal>(
      BaseCacheFileNames.REGISTERED_TOPICS,
    );
    console.log(topicsLocal);
    if (topicsLocal.topics) topicsLocal.topics.forEach((topic: string) => roomTopics.add(topic));
  }
  const roomPromises = Array.from(roomTopics).map(async (roomName: string) => {
    try {
      const room = await wechaty.Room.find({ topic: roomName });
      if (room) {
        console.log('\x1b[32m%s\x1b[0m', `✅ Room "${roomName}" found`);
        return room;
      } else {
        console.log('\x1b[31m%s\x1b[0m', `❌ Room "${roomName}" not found`);
        return null;
      }
    } catch (error) {
      console.log('Error finding room', roomName);
      return null;
    }
  });

  const rooms = await Promise.all(roomPromises);
  await console.log('chulaile rooms', rooms);
  const validRooms = rooms.filter((room): room is Room => room !== null);
  await updateRegisteredTopics(validRooms);
  return validRooms;
}

const executeCommandInAllRooms = async (command: string, silent: boolean) => {
  for (const room of targetRooms) {
    await commandHandler.handleCommand(
      {
        text: () => `@BOT ${command}`,
        room: () => room,
      } as any,
      silent,
    );
  }
};

async function checkAndTriggerDailySummary() {
  await executeCommandInAllRooms('intern-daily', true);
  await executeCommandInAllRooms('ng-daily', true);
}
cron.schedule('0 20 * * *', async () => {
  console.log('Running a job at 15:44');
  await checkAndTriggerDailySummary();
});
let commandHandler: CommandHandler;

wechaty
  .on('scan', (qrcode: string, status) => {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      const qrcodeImageUrl = ['https://wechaty.js.org/qrcode/', encodeURIComponent(qrcode)].join(
        '',
      );
      console.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl);

      qrcodeTerminal.generate(qrcode, { small: true }); // show qrcode on console
    } else {
      console.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status);
    }
  })
  .on('login', async (user: ContactImpl) => {
    console.log('\x1b[36m%s\x1b[0m', `🎉 User ${user} logged in successfully!`);

    targetRooms = await getTargetRooms();
    commandHandler = new CommandHandler(jobProviders, targetRooms);

    if (targetRooms.length > 0) {
      console.log(
        '\x1b[36m%s\x1b[0m',
        `🚀 ${targetRooms.length} target room(s) found. Bot is ready!`,
      );

      setInterval(
        () => executeCommandInAllRooms('intern', true),
        jobWxBotConfig.minsCheckInterval * 60 * 1000,
      );
      setInterval(
        () => executeCommandInAllRooms('ng', true),
        jobWxBotConfig.minsCheckInterval * 60 * 1000,
      );
      await executeCommandInAllRooms('intern', true);
      await executeCommandInAllRooms('ng', true);
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
