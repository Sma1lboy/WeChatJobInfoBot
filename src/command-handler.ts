import { Message, Room, Contact } from 'wechaty';
import { InternJobProvider } from './providers/internship-job-provider';
import { NGJobProvider } from './providers/new-graduate-job-provider';
import { FileSystemService } from './file-system-service';

interface Command {
  name: string;
  aliases: string[];
  description: string;
  execute: (message: Message, args: string[]) => Promise<void>;
}

export class CommandHandler {
  private commands: Command[];
  private internJob: InternJobProvider;
  private newGradJob: NGJobProvider;
  private targetRooms: Room[];

  constructor(internJob: InternJobProvider, newGradJob: NGJobProvider, targetRooms: Room[]) {
    this.internJob = internJob;
    this.newGradJob = newGradJob;
    this.targetRooms = targetRooms;

    this.commands = [
      {
        name: 'add-this',
        aliases: [],
        description: "Add this room to the bot's target list (admin only)",
        execute: async (message: Message) => {
          const room = message.room();
          const sender = message.talker();

          if (room && sender && (await this.isRoomOwnerOrAdmin(room, sender))) {
            const roomTopic = await room.topic();
            await this.addRoomToRegistry(roomTopic);
            await message.say(`Room "${roomTopic}" has been added to the bot's target list.`);
          } else {
            await message.say(
              "Sorry, only room owners or admins can add rooms to the bot's target list.",
            );
          }
        },
      },
      {
        name: 'intern',
        aliases: ['internjobs'],
        description: 'Get new intern job postings',
        execute: async (message: Message) => {
          if (!(await this.sendJobUpdates(this.internJob))) {
            await message.say('No new jobs found for Intern roles');
          }
        },
      },
      {
        name: 'ng',
        aliases: ['ngjobs'],
        description: 'Get new graduate job postings',
        execute: async (message: Message) => {
          if (!(await this.sendJobUpdates(this.newGradJob))) {
            await message.say('No new jobs found for New Graduate roles');
          }
        },
      },
      {
        name: 'help',
        aliases: [],
        description: 'Show this help message',
        execute: async (message: Message) => {
          let helpMessage = 'Available commands:\n';
          this.commands.forEach((command) => {
            helpMessage += `- @BOT ${command.name}: ${command.description}\n`;
            if (command.aliases.length > 0) {
              helpMessage += `  Aliases: ${command.aliases.join(', ')}\n`;
            }
          });
          await message.say(helpMessage);
        },
      },
    ];
  }

  async handleCommand(message: Message) {
    const text = message.text().toLowerCase();
    const commandMatch = text.match(/@\S+\s+(.+)/);
    const commandName = commandMatch ? commandMatch[1].split(' ')[0] : '';

    const command = this.commands.find(
      (cmd) => cmd.name === commandName || cmd.aliases.includes(commandName),
    );

    if (command) {
      const args = commandMatch ? commandMatch[1].split(' ').slice(1) : [];
      await command.execute(message, args);
    } else {
      await message.say('Unrecognized command. Use "@BOT help" for available commands.');
    }
  }

  private async isRoomOwnerOrAdmin(room: Room, contact: Contact): Promise<boolean> {
    const roomOwner = await room.owner();
    return roomOwner ? roomOwner.id === contact.id : false;
  }

  private async addRoomToRegistry(roomTopic: string) {
    const registeredTopicsPath = 'registered-topics.json';
    let topicsLocal: { topics: string[] } = { topics: [] };

    if (FileSystemService.fileExists(registeredTopicsPath)) {
      topicsLocal = FileSystemService.readJSON<{ topics: string[] }>(registeredTopicsPath);
    }

    if (!topicsLocal.topics.includes(roomTopic)) {
      topicsLocal.topics.push(roomTopic);
      FileSystemService.writeJSON(registeredTopicsPath, topicsLocal);
      console.log(`Added room "${roomTopic}" to the registry.`);
    } else {
      console.log(`Room "${roomTopic}" is already in the registry.`);
    }
  }

  private async sendJobUpdates(provider: InternJobProvider | NGJobProvider) {
    console.log(`Checking for new ${provider.jobType} jobs... now !`);
    if (this.targetRooms.length === 0) {
      console.log('No target rooms set');
      return false;
    }
    const newJobs = await provider.getNewJobs();
    if (newJobs.length > 0) {
      const messages = provider.formatJobMessages(newJobs);
      for (const room of this.targetRooms) {
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
}
