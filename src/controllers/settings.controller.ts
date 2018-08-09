import { GuildChannel, Message } from "eris";
import * as moment from "moment-timezone";

import { CommandError } from "../classes/command-error.class";
import { SchedulerBot } from "../classes/schedulerbot.class";
import { CalendarDocument, CalendarModel as Calendar } from "../models/calendar.model";
import { CommandController } from "./command.controller";
// tslint:disable-next-line
const STRINGS: any = require("../resources/strings.resource.json");

export class SettingsController extends CommandController {
  constructor(bot: SchedulerBot) {
    super(bot);
  }

  public viewSettings = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();

      this.bot.createMessage(msg.channel.id, {
        embed: {
          author: {
            name: "SchedulerBot",
            icon_url: "https://cdn.discordapp.com/avatars/339019867325726722/e5fca7dbae7156e05c013766fa498fe1.png"
          },
          color: 13893595,
          description: "Run `settings <setting>` to view more details. e.g. `settings prefix`",
          fields: [
            {
              name: "prefix",
              value: `Current value: \`${calendar.prefix}\``,
              inline: true
            },
            {
              name: "defaultchannel",
              value: `Current value: <#${calendar.defaultChannel}>`,
              inline: true
            },
            {
              name: "timezone",
              value: `Current value: ${calendar.timezone}`,
              inline: true
            }
          ],
          title: "Settings"
        }
      });
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public prefixSetting = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();

      if (args.length < 1 || args.length > 1) {
        if (!calendar.checkPerm("prefix.show", msg)) { return STRINGS.commandResponses.permissionDenied; }
        this.bot.createMessage(msg.channel.id, {
          embed: {
            author: {
              name: "SchedulerBot",
              icon_url: "https://cdn.discordapp.com/avatars/339019867325726722/e5fca7dbae7156e05c013766fa498fe1.png"
            },
            color: 13893595,
            description: "Run `settings prefix <newPrefix>` to change the prefix. e.g. `settings prefix ++`",
            fields: [
              {
                name: "Current Value",
                value: `\`${calendar.prefix}\``,
                inline: true
              }
            ],
            title: "Settings: Prefix"
          }
        });
      }
      else {
        if (!calendar.checkPerm("prefix.modify", msg)) { return STRINGS.commandResponses.permissionDenied; }
        await calendar.updatePrefix(args[0]);
        const prefixes: string[] = [args[0], "@mention "];
        this.bot.registerGuildPrefix((msg.channel as GuildChannel).guild.id, prefixes);
        return `Prefix set to \`${prefixes[0]}\`.`;
      }
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public defaultChannelSetting = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const guildID = (msg.channel as GuildChannel).guild.id;
      const calendar: CalendarDocument = await Calendar.findById(guildID).exec();

      if (args.length !== 1 || msg.channelMentions.length !== 1) {
        if (!calendar.checkPerm("defaultchannel.show", msg)) { return STRINGS.commandResponses.permissionDenied; }
        this.bot.createMessage(msg.channel.id, {
          embed: {
            author: {
              name: "SchedulerBot",
              icon_url: "https://cdn.discordapp.com/avatars/339019867325726722/e5fca7dbae7156e05c013766fa498fe1.png"
            },
            color: 13893595,
            description: "Run `settings defaultchannel #newchannel` to change the prefix. e.g. `settings defaultchannel #general`", // tslint:disable-line
            fields: [
              {
                name: "Current Value",
                value: `<#${calendar.defaultChannel}>`,
                inline: true
              }
            ],
            title: "Settings: Default Channel"
          }
        });
      }
      else {
        if (!calendar.checkPerm("defaultchannel.modify", msg)) { return STRINGS.commandResponses.permissionDenied; }
        await calendar.updateDefaultChannel(msg.channelMentions[0]);
        calendar.events.forEach((event) => {
          this.bot.eventScheduler.rescheduleEvent(calendar, event);
        });
        return `Updated default channel to <#${calendar.defaultChannel}>.`;
      }
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public timezoneSetting = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const guildID = (msg.channel as GuildChannel).guild.id;
      const calendar: CalendarDocument = await Calendar.findById(guildID).exec();

      if (args.length !== 1) {
        if (!calendar.checkPerm("timezone.show", msg)) { return STRINGS.commandResponses.permissionDenied; }
        this.bot.createMessage(msg.channel.id, {
          embed: {
            author: {
              name: "SchedulerBot",
              icon_url: "https://cdn.discordapp.com/avatars/339019867325726722/e5fca7dbae7156e05c013766fa498fe1.png"
            },
            color: 13893595,
            description: "Run `settings timezone <new timezone>` to change the prefix. e.g. `settings timezone America/Los_Angeles`\nSee https://goo.gl/NzNMon under the TZ column for a list of valid timezones.", // tslint:disable-line
            fields: [
              {
                name: "Current Value",
                value: `${calendar.timezone}`,
                inline: true
              }
            ],
            title: "Settings: Timezone"
          }
        });
      }
      else if (!moment.tz.zone(args[0])) {
        return STRINGS.commandResponses.timezoneNotFound;
      }
      else {
        if (!calendar.checkPerm("timezone.modify", msg)) { return STRINGS.commandResponses.permissionDenied; }
        const updateSuccess: boolean = await calendar.updateTimezone(args[0]);
        if (!updateSuccess) {
          // tslint:disable-next-line
          return `Cannot update timezone, due to events starting or ending in the past if the timezone is changed to ${args[0]}.`;
        }
        for (const event of calendar.events) {
          this.bot.eventScheduler.rescheduleEvent(calendar, event);
        }
        return `Updated timezone to ${calendar.timezone}.`;
      }
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public registerCommands(): boolean {
    const settingsCommand = this.bot.registerCommand("settings", this.viewSettings);
    settingsCommand.registerSubcommand("prefix", this.prefixSetting);
    settingsCommand.registerSubcommand("defaultchannel", this.defaultChannelSetting);
    settingsCommand.registerSubcommand("timezone", this.timezoneSetting);
    return true;
  }
}
