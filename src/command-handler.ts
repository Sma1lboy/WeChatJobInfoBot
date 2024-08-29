import { Message, Room, Contact } from 'wechaty';
import { InternshipJobProvider } from './providers/internship-job-provider';
import { NewGraduateJobProvider } from './providers/new-graduate-job-provider';
import { FileSystemService } from './file-system-service';
import { AnnotationType, Job, JobProvider, JobType, RoomsCacheFileNames } from './types';

interface Command {
  name: string;
  aliases: string[];
  description: string;
  execute: (message: Message, args: string[], silent?: boolean) => Promise<void>;
}

export class CommandHandler {
  private commands: Command[];
  private targetRooms: Room[];
  private jobProviders: JobProvider[];

  constructor(jobProviders: JobProvider[], targetRooms: Room[]) {
    this.jobProviders = jobProviders;
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
            for (const provider of this.jobProviders) {
              if (provider.jobType === JobType.INTERN) {
                if (!(await this.sendJobUpdates(provider, room))) {
                  if (!silent) {
                    await this.sendMessage(message, 'No new jobs found for Intern roles');
                  }
                }
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
            for (const provider of this.jobProviders) {
              if (provider.jobType === JobType.NEW_GRAD) {
                if (!(await this.sendJobUpdates(provider, room))) {
                  if (!silent) {
                    await this.sendMessage(message, 'No new jobs found for New Graduate roles');
                  }
                }
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
      {
        name: 'intern-daily',
        aliases: [],
        description:
          'Provides a summary of all internship positions posted in the last 24 hours within the room.',
        execute: async (message: Message) => {
          const room = message.room();
          const roomTopic = await room?.topic();
          if (!roomTopic || !room) return;
          await this.sendJobDailySummary(room, JobType.INTERN);
        },
      },
      {
        name: 'ng-daily',
        aliases: [],
        description:
          'Provides a summary of all new grad positions posted in the last 24 hours within the room.',
        execute: async (message: Message) => {
          const room = message.room();
          const roomTopic = await room?.topic();
          if (!roomTopic || !room) return;
          await this.sendJobDailySummary(room, JobType.NEW_GRAD);
        },
      },
      {
        name: 'excel',
        aliases: [],
        description: 'Get the excel sheet',
        execute: async (message: Message) => {
          const room = message.room();
          const roomTopic = await room?.topic();
          if (!roomTopic || !room) return;
          //read roomTopic from
          let jobs: Job[] = [];
          if (FileSystemService.fileExists(roomTopic, RoomsCacheFileNames.SENT_INTERN_JOBS)) {
            jobs = FileSystemService.readJSON<Job[]>(
              roomTopic,
              RoomsCacheFileNames.SENT_INTERN_JOBS,
            );
          }
        },
      },
    ];
  }

  private async sendJobDailySummary(room: Room, jobType: JobType) {
    const roomTopic = await room.topic();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let allJobs: Job[] = [];
    for (const provider of this.jobProviders) {
      if (provider.jobType === jobType) {
        const jobs = await provider.getAllSentJobMessages(roomTopic);
        allJobs = allJobs.concat(jobs);
      }
    }

    const recentJobs = allJobs.filter((job) => {
      const jobDate = new Date(job.dateMessageSent);
      return jobDate >= yesterday;
    });

    if (recentJobs.length === 0) {
      await room.say(`No new ${jobType} positions were posted in the last 24 hours.`);
      return;
    }

    const companySummary: Record<string, Job[]> = recentJobs.reduce(
      (acc, job) => {
        if (!acc[job.company]) {
          acc[job.company] = [];
        }
        acc[job.company].push(job);
        return acc;
      },
      {} as Record<string, Job[]>,
    );

    let summaryMessage = `📊 ${jobType} Daily Summary 📊\n\n`;
    summaryMessage += `New ${jobType.toLowerCase()} positions in the last 24 hours:\n\n`;

    const annotationIcons: Record<string, string> = {
      [AnnotationType.NoSponsorship.toString()]: '🛂',
      [AnnotationType.USCitizenshipRequired.toString()]: '🇺🇸',
      [AnnotationType.Closed.toString()]: '🔒',
    };

    for (const [company, jobs] of Object.entries(companySummary)) {
      summaryMessage += `🏢 ${company}:\n`;
      jobs.forEach((job) => {
        const jobAnnotationIcons = job.annotations.map((anno) => annotationIcons[anno]).join('');
        summaryMessage += `   • ${job.role} (${job.location}) ${jobAnnotationIcons}\n`;
      });
      summaryMessage += '\n';
    }

    summaryMessage += `Total positions: ${recentJobs.length}\n\n`;
    summaryMessage += 'Icon explanations:\n';
    summaryMessage += '🛂 - No Sponsorship\n';
    summaryMessage += '🇺🇸 - U.S. Citizenship Required\n';
    summaryMessage += '🔒 - Closed\n';

    const maxMessageLength = 4000;
    if (summaryMessage.length > maxMessageLength) {
      const messages = this.splitMessage(summaryMessage, maxMessageLength);
      for (const msg of messages) {
        await room.say(msg);
      }
    } else {
      await room.say(summaryMessage);
    }
  }

  private splitMessage(message: string, maxLength: number): string[] {
    const messages: string[] = [];
    let currentMessage = '';
    const lines = message.split('\n');

    for (const line of lines) {
      if ((currentMessage + line + '\n').length > maxLength) {
        if (currentMessage) {
          messages.push(currentMessage.trim());
          currentMessage = '';
        }
        if (line.length > maxLength) {
          // If a single line is too long, split it
          const words = line.split(' ');
          let tempLine = '';
          for (const word of words) {
            if ((tempLine + word + ' ').length > maxLength) {
              messages.push(tempLine.trim());
              tempLine = '';
            }
            tempLine += word + ' ';
          }
          if (tempLine) {
            currentMessage = tempLine;
          }
        } else {
          currentMessage = line + '\n';
        }
      } else {
        currentMessage += line + '\n';
      }
    }

    if (currentMessage) {
      messages.push(currentMessage.trim());
    }

    return messages;
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

    if (FileSystemService.baseFileExists(registeredTopicsPath)) {
      topicsLocal = FileSystemService.readBaseJSON<{ topics: string[] }>(registeredTopicsPath);
    }

    if (!topicsLocal.topics.includes(roomTopic)) {
      topicsLocal.topics.push(roomTopic);
      FileSystemService.writeBaseJSON(registeredTopicsPath, topicsLocal);
      console.log(`Added room "${roomTopic}" to the registry.`);
    } else {
      console.log(`Room "${roomTopic}" is already in the registry.`);
    }
  }

  private async sendJobUpdates(provider: JobProvider, room: Room) {
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
