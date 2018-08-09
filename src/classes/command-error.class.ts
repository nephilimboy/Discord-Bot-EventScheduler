import { GuildChannel, Message } from "eris";
import * as raven from "raven";
import * as winston from "winston";

export class CommandError {
  private error: any;
  private message: Message;
  private eventID: string;

  constructor(error: any, msg: Message) {
    this.error = error;
    this.message = msg;
    if (process.env.NODE_ENV === "production") {
      this.eventID = raven.captureException(error, {
        extra: {
          guildID: (this.message.channel as GuildChannel).guild.id,
          messageContent: this.message.content
        },
        user: {
          id: this.message.author.id,
          username: `${this.message.author.username}#${this.message.author.discriminator}`
        }
      });
    }
    winston.error(error);
  }

  public toString(): string {
    let str: string = "An error has occurred. Please report this in the support server using the `support` command.\n";
    if (process.env.NODE_ENV === "production") {
      str += `Error event ID: ${this.eventID}\n`;
    }
    str += "```\n";
    if (typeof this.error === "string") {
      str += this.error;
    }
    else if (this.error.message && typeof this.error.message === "string") {
      str += this.error.message;
    }
    else {
      str += "Unknown error";
    }
    str += "\n```";

    return str;
  }
}

export default CommandError;
