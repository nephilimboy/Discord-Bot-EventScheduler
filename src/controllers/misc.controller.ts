import { EmbedOptions, GuildChannel, Message } from "eris";
import * as moment from "moment-timezone";

import { CommandError } from "../classes/command-error.class";
import { Period } from "../classes/period.class";
import { SchedulerBot } from "../classes/schedulerbot.class";
import { CalendarDocument, CalendarModel as Calendar } from "../models/calendar.model";
import { CommandController } from "./command.controller";
/* tslint:disable */
const version: string = require("../../package.json").version;
const STRINGS: any = require("../resources/strings.resource.json");
/* tslint:enable */

export class MiscController extends CommandController {
  constructor(bot: SchedulerBot) {
    super(bot);
  }

  public ping = async (msg: Message, args: string[]): Promise<string> => {
    const now: moment.Moment = moment();
    const diff: number = now.diff(moment(msg.timestamp));
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();
      if (!calendar.checkPerm("ping", msg)) { return STRINGS.commandResponses.permissionDenied; }
      return `Pong! Time: ${diff}ms`;
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public prefix = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();
      if (!calendar.checkPerm("prefix.show", msg)) { return STRINGS.commandResponses.permissionDenied; }
      return `Prefix: ${calendar.prefix}\nRun \`settings prefix <newPrefix>\` to change the prefix.`;
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public info = (msg: Message, args: string[]): void => {
    const uptimeParsed: Period = new Period(this.bot.uptime);
    const embed: EmbedOptions = {
      author: {
        name: "SchedulerBot",
        icon_url: "https://cdn.discordapp.com/avatars/339019867325726722/e5fca7dbae7156e05c013766fa498fe1.png"
      },
      color: 13893595,
      description: "A Discord bot for scheduling events.",
      fields: [
        {
          name: "Version",
          value: version.toString(),
          inline: true
        },
        {
          name: "Guilds",
          value: this.bot.guilds.size.toString(),
          inline: true
        },
        {
          name: "Users",
          value: this.bot.users.size.toString(),
          inline: true
        },
        {
          name: "Uptime",
          // tslint:disable-next-line
          value: `${uptimeParsed.days} day(s), ${uptimeParsed.hours} hour(s), ${uptimeParsed.minutes} minute(s), ${uptimeParsed.seconds} second(s)`
        }
      ],
      footer: {
        text: "Powered by the Eris library (https://abal.moe/Eris)"
      }
    };

    this.bot.createMessage(msg.channel.id, { embed });
  }

  public support(msg: Message, args: string[]): string {
    return STRINGS.commandResponses.supportServerLink;
  }

  public invite(msg: Message, args: string[]): string {
    return STRINGS.commandResponses.botInviteLink;
  }

  public registerCommands(): boolean {
    this.bot.registerCommand("ping", this.ping);
    this.bot.registerCommand("info", this.info);
    this.bot.registerCommand("prefix", this.prefix);
    this.bot.registerCommand("support", this.support);
    this.bot.registerCommand("invite", this.invite);
    return true;
  }
}

export default MiscController;
