import { Message, Room, Contact } from 'wechaty';
import { InternshipJobProvider } from './providers/internship-job-provider';
import { NewGraduateJobProvider } from './providers/new-graduate-job-provider';
import { FileSystemService } from './file-system-service';

interface Command {
  name: string;
  aliases: string[];
  description: string;
  execute: (message: Message, args: string[], silent?: boolean) => Promise<void>;
}

export class CommandHandler {
  private commands: Command[];
  private internJob: InternshipJobProvider;
  private newGradJob: NewGraduateJobProvider;
  private targetRooms: Room[];

  constructor(
    internJob: InternshipJobProvider,
    newGradJob: NewGraduateJobProvider,
    targetRooms: Room[],
  ) {
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
            await this.sendMessage(
              message,
              `Room "${roomTopic}" has been added to the bot's target list.`,
            );
          } else {
            await this.sendMessage(
              message,
              "Sorry, only room owners or admins can add rooms to the bot's target list.",
            );
          }
        },
      },
      {
        name: 'intern',
        aliases: ['internjobs'],
        description: 'Get new intern job postings',
        execute: async (message: Message, args: string[], silent = false) => {
          const room = message.room();
          if (room) {
            if (!(await this.sendJobUpdates(this.internJob, room))) {
              if (!silent) {
                await this.sendMessage(message, 'No new jobs found for Intern roles');
              }
            }
          } else {
            await this.sendMessage(message, 'This command can only be used in a room.');
          }
        },
      },
      {
        name: 'ng',
        aliases: ['ngjobs'],
        description: 'Get new graduate job postings',
        execute: async (message: Message, args: string[], silent = false) => {
          const room = message.room();
          if (room) {
            if (!(await this.sendJobUpdates(this.newGradJob, room))) {
              if (!silent) {
                await this.sendMessage(message, 'No new jobs found for New Graduate roles');
              }
            }
          } else {
            await this.sendMessage(message, 'This command can only be used in a room.');
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
          await this.sendMessage(message, helpMessage);
        },
      },
    ];
  }

  async handleCommand(message: Message, silent = false) {
    const text = message.text().toLowerCase();
    const commandMatch = text.match(/@\S+\s+(.+)/);
    const commandName = commandMatch ? commandMatch[1].split(' ')[0] : '';

    const command = this.commands.find(
      (cmd) => cmd.name === commandName || cmd.aliases.includes(commandName),
    );

    if (command) {
      const args = commandMatch ? commandMatch[1].split(' ').slice(1) : [];
      await command.execute(message, args, silent);
    } else if (!silent) {
      await this.sendMessage(
        message,
        'Unrecognized command. Use "@BOT help" for available commands.',
      );
    }
  }

  private async sendMessage(message: Message, content: string) {
    const room = message.room();
    if (room) {
      await room.say(content);
    } else {
      await message.say(content);
    }
  }

  private async isRoomOwnerOrAdmin(room: Room, contact: Contact): Promise<boolean> {
    const roomOwner = await room.owner();
    return roomOwner ? roomOwner.id === contact.id : false;
  }

  private async addRoomToRegistry(roomTopic: string) {
    const registeredTopicsPath = 'registered-topics.json';
    let topicsLocal: { topics: string[] } = { topics: [] };

    if (FileSystemService.globalFileExists(registeredTopicsPath)) {
      topicsLocal = FileSystemService.readGlobalJSON<{ topics: string[] }>(registeredTopicsPath);
    }

    if (!topicsLocal.topics.includes(roomTopic)) {
      topicsLocal.topics.push(roomTopic);
      FileSystemService.writeGlobalJSON(registeredTopicsPath, topicsLocal);
      console.log(`Added room "${roomTopic}" to the registry.`);
    } else {
      console.log(`Room "${roomTopic}" is already in the registry.`);
    }
  }

  private async sendJobUpdates(
    provider: InternshipJobProvider | NewGraduateJobProvider,
    room: Room,
  ) {
    const roomTopic = await room.topic();
    console.log(`Checking for new ${provider.jobType} jobs for room ${roomTopic}... now !`);

    const newJobs = await provider.getNewJobs(roomTopic);
    if (newJobs.length > 0) {
      const messages = provider.formatJobMessages(newJobs);
      for (const message of messages) {
        await room.say(message);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return true;
    } else {
      console.log(`No new ${provider.jobType} jobs found for room ${roomTopic}`);
      return false;
    }
  }
}
