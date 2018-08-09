import { Command, EmbedBase, GuildChannel, Message } from "eris";
import * as moment from "moment-timezone";

import { CommandError } from "../classes/command-error.class";
import { EventEmbedFactory } from "../classes/event-embed-factory.class";
import { EventParser } from "../classes/event-parser.class";
import { SchedulerBot } from "../classes/schedulerbot.class";
import { config } from "../config/bot.config";
import { Event } from "../interfaces/event.interface";
import { CalendarDocument, CalendarModel as Calendar } from "../models/calendar.model";
import { EventDocument } from "../models/event.model";
import { CommandController } from "./command.controller";
const STRINGS: any = require("../resources/strings.resource.json"); // tslint:disable-line

export class CalendarController extends CommandController {
  private eventEmbedFactory: EventEmbedFactory;

  constructor(bot: SchedulerBot) {
    super(bot);
    this.eventEmbedFactory = new EventEmbedFactory();
  }

  public initializeCalendar = async (msg: Message, args: string[]): Promise<string> => {
    try {
      if (args.length > 1 || args.length < 1) {
        // tslint:disable-next-line
        return `Usage: ${STRINGS.commandUsage.init} - see https://goo.gl/NzNMon under the TZ column for a list of valid timezones.`;
      }

      let calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();
      if (!calendar) {
        const newCal: CalendarDocument = new Calendar({
          _id: (msg.channel as GuildChannel).guild.id,
          defaultChannel: msg.channel.id,
          prefix: config.prefix
        });
        calendar = await newCal.save();
      }

      if (calendar.timezone) {
        return STRINGS.commandResponses.timezoneInitialized;
      }
      else {
        if (!moment.tz.zone(args[0])) { return STRINGS.commandResponses.timezoneNotFound; }
        calendar.timezone = args[0];
        calendar.defaultChannel = msg.channel.id;
        await calendar.save();
        return `Set calendar timezone to ${calendar.timezone} and default channel to <#${calendar.defaultChannel}>.`;
      }
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public addEvent = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const now: moment.Moment = moment();
      const guildID: string = (msg.channel as GuildChannel).guild.id;
      if (args.length < 1) { return `Usage: ${STRINGS.commandUsage.event.create}`; }

      const lock = await this.bot.calendarLock.acquire(guildID);
      const calendar: CalendarDocument = await Calendar.findById(guildID).exec();
      if (!calendar || !calendar.timezone) {
        this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.timezoneNotSet);
      }
      else if (!calendar.checkPerm("event.create", msg)) {
        this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.permissionDenied);
      }
      else {
        const parsedEvent: Event = EventParser.parse(args, calendar.timezone, now);
        if (!parsedEvent.name && !parsedEvent.startDate) {
          this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.eventParseFail);
        }
        else if (parsedEvent.repeat &&
                 parsedEvent.repeat !== "d" &&
                 parsedEvent.repeat !== "w" &&
                 parsedEvent.repeat !== "m") {
          this.bot.createMessage(msg.channel.id, `Usage: ${STRINGS.commandUsage.event.create}`);
        }
        else if (now.diff(parsedEvent.startDate) > 0) {
          this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.createEventInPast);
        }
        else {
          const event: EventDocument = await calendar.addEvent(parsedEvent);
          this.bot.eventScheduler.scheduleEvent(calendar, event);
          const embed: EmbedBase = this.eventEmbedFactory.getNewEventEmbed(event, calendar.timezone);

          this.bot.createMessage(msg.channel.id, {
            content: "New event created.",
            embed
          });
        }
      }
      await lock.release();
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public listEvents = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();
      if (!calendar || !calendar.timezone) { return STRINGS.commandResponses.timezoneNotSet; }
      if (!calendar.checkPerm("event.list", msg)) { return STRINGS.commandResponses.permissionDenied; }

      const now: moment.Moment = moment();
      let resultString: string = "```css\n";

      if (calendar.events.length < 1) {
        resultString += "No events found!\n";
      }
      else {
        let i: number = 0;
        const activeEventHeaderWritten: boolean = false;
        while (i < calendar.events.length && now.diff(moment(calendar.events[i].startDate)) > 0) {
          if (!activeEventHeaderWritten) {
            resultString += "[Active Events]\n\n";
          }
          // tslint:disable-next-line
          resultString += `${i + 1} : ${calendar.events[i].name} /* ${moment(calendar.events[i].startDate).tz(calendar.timezone).toString()} to ${moment(calendar.events[i].endDate).tz(calendar.timezone).toString()} */\n`;
          if (calendar.events[i].description) {
            resultString += `    # ${calendar.events[i].description}\n`;
          }
          if (calendar.events[i].repeat) {
            resultString += `    # Repeat: ${calendar.events[i].repeat}\n`;
          }
          i++;
        }
        if (i < calendar.events.length) {
          resultString += "\n[Upcoming Events]\n\n";
        }
        while (i < calendar.events.length) {
          // tslint:disable-next-line
          resultString += `${i + 1} : ${calendar.events[i].name} /* ${moment(calendar.events[i].startDate).tz(calendar.timezone).toString()} to ${moment(calendar.events[i].endDate).tz(calendar.timezone).toString()} */\n`;
          if (calendar.events[i].description) {
            resultString += `    # ${calendar.events[i].description}\n`;
          }
          if (calendar.events[i].repeat) {
            resultString += `    # Repeat: ${calendar.events[i].repeat}\n`;
          }
          i++;
        }
      }
      resultString += "```";
      return resultString;
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public deleteEvent = async (msg: Message, args: string[]): Promise<string> => {
    try {
      if (args.length < 1 || args.length > 1) { return `Usage: ${STRINGS.commandUsage.event.delete}`; }

      let index: number = parseInt(args[0], 10);
      if (isNaN(index)) { return `Usage: ${STRINGS.commandUsage.event.delete}`; }

      index--;
      const guildID: string = (msg.channel as GuildChannel).guild.id;

      const lock = await this.bot.calendarLock.acquire(guildID);
      const calendar: CalendarDocument = await Calendar.findById(guildID).exec();
      if (!calendar) {
        this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.timezoneNotSet);
      }
      else if (!calendar.checkPerm("event.delete", msg)) {
        this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.permissionDenied);
      }
      else if (index < 0 || index >= calendar.events.length) {
        this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.eventNotFound);
      }
      else {
        const deletedEvent: EventDocument = await calendar.deleteEvent(index);
        this.bot.eventScheduler.unscheduleEvent(deletedEvent);
        const embed: EmbedBase = this.eventEmbedFactory.getDeleteEventEmbed(deletedEvent, calendar.timezone);

        this.bot.createMessage(msg.channel.id, {
          content: "Event deleted.",
          embed
        });
      }
      await lock.release();
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public updateEvent = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const now: moment.Moment = moment();
      if (args.length < 2) { return `Usage: ${STRINGS.commandUsage.event.update}`; }

      let index: number = parseInt(args[0], 10);
      if (isNaN(index)) { return `Usage: ${STRINGS.commandUsage.event.update}`; }
      index--;

      const guildID: string = (msg.channel as GuildChannel).guild.id;
      const lock = await this.bot.calendarLock.acquire(guildID);
      let badInput: boolean = false;
      const calendar: CalendarDocument = await Calendar.findById(guildID).exec();
      if (!calendar) { this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.timezoneNotSet); }
      else if (!calendar.checkPerm("event.update", msg)) {
        this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.permissionDenied);
      }
      else {
        const parsedEvent: Event = EventParser.parse(args.slice(1), calendar.timezone, now);
        if (!parsedEvent.name && !parsedEvent.description && !parsedEvent.repeat) {
          this.bot.createMessage(msg.channel.id, `Usage: ${STRINGS.commandUsage.event.update}`);
          badInput = true;
        }
        else {
          if (parsedEvent.startDate) {
            if (now.diff(parsedEvent.startDate) > 0) {
              this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.updateEventInPast);
              badInput = true;
            }
            else if (now.diff(moment(calendar.events[index].startDate)) > 0) {
              this.bot.createMessage(msg.channel.id, STRINGS.commandResponses.updateActiveEvent);
              badInput = true;
            }
          }
          if (parsedEvent.repeat) {
            const repeat = parsedEvent.repeat;
            if (repeat !== "d" && repeat !== "w" && repeat !== "m" && repeat !== "off") {
              this.bot.createMessage(msg.channel.id, `Usage: ${STRINGS.commandUsage.event.update}`);
              badInput = true;
            }
          }
        }

        if (index < 0 || index >= calendar.events.length) { return STRINGS.commandResponses.eventNotFound; }
        else if (!badInput) {
          const updatedEvent: EventDocument = await calendar.updateEvent(index, parsedEvent);
          this.bot.eventScheduler.rescheduleEvent(calendar, updatedEvent);
          const embed: EmbedBase = this.eventEmbedFactory.getUpdateEventEmbed(updatedEvent, calendar.timezone);

          this.bot.createMessage(msg.channel.id, {
            content: "Event updated.",
            embed
          });
        }
      }
      await lock.release();
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public registerCommands(): boolean {
    this.bot.registerCommand("init", this.initializeCalendar);
    const eventAddCommand: Command = this.bot.registerCommand("event", this.addEvent);
    eventAddCommand.registerSubcommand("list", this.listEvents);
    eventAddCommand.registerSubcommand("delete", this.deleteEvent);
    eventAddCommand.registerSubcommand("update", this.updateEvent);
    return true;
  }
}

export default CalendarController;
