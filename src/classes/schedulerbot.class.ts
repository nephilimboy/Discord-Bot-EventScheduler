import { CommandClient } from "eris";
import * as mongoose from "mongoose";
import { createClient, RedisClient } from "redis";
import * as winston from "winston";

import { config } from "../config/bot.config";
import { AdminController } from "../controllers/admin.controller";
import { CalendarController } from "../controllers/calendar.controller";
import { CommandController } from "../controllers/command.controller";
import { HelpController } from "../controllers/help.controller";
import { MiscController } from "../controllers/misc.controller";
import { PermsController } from "../controllers/perms.controller";
import { SettingsController } from "../controllers/settings.controller";
import { CalendarDocument, CalendarModel as Calendar } from "../models/calendar.model";
import { CalendarLock } from "./calendar-lock.class";
import { EventScheduler } from "./event-scheduler.class";

export class SchedulerBot extends CommandClient {
  private _redisClient: RedisClient;
  private _db: mongoose.Connection;
  private _eventScheduler: EventScheduler;
  private _calendarLock: CalendarLock;
  private controllers: CommandController[];

  public constructor() {
    super(process.env.BOT_TOKEN, {}, {
      defaultHelpCommand: false,
      description: "A Discord bot for scheduling events",
      owner: "Pyrox",
      prefix: [config.prefix, "@mention "],
      defaultCommandOptions: {
        guildOnly: true,
        cooldown: 1000,
        cooldownReturns: 1,
        cooldownMessage: "Command is on cooldown."
      }
    });

    this.controllers = [];
    this._eventScheduler = new EventScheduler(this);

    mongoose.connect(process.env.MONGODB_URI);
    this._db = mongoose.connection;
    this._db.on("open", () => {
      console.log("Connected to database");
      // TODO: Add MongoDB transport for winston if fixed
    });
    this._db.on("error", (err) => {
      console.log("Mongoose error: " + err);
      process.exit();
    });

    const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
    this._redisClient = createClient(redisPort);
    this._redisClient.on("ready", () => {
      console.log("Connected to Redis server");
    });
    this._redisClient.on("error", (err) => {
      console.log("Redis error: " + err);
      process.exit();
    });

    this._calendarLock = new CalendarLock(this._redisClient);

    // Emit 'dbconnect' event when both data stores are connected
    const p1: Promise<boolean> = new Promise((resolve, reject) => {
      this.db.on("open", () => { resolve(true); });
    });
    const p2: Promise<boolean> = new Promise((resolve, reject) => {
      this.redisClient.on("ready", () => { resolve(true); });
    });
    Promise.all([p1, p2]).then((values) => {
      this.emit("dbconnect");
    });

    // Load controllers, event handlers and data when ready
    this.on("ready", () => {
      console.log("Loading command controllers... ");
      this.loadControllers([
        new MiscController(this),
        new CalendarController(this),
        new AdminController(this),
        new PermsController(this),
        new HelpController(this),
        new SettingsController(this)
      ]);
      console.log("Loading event handlers...");
      this.loadEventHandlers();
      console.log("Loading guild data...");
      (async () => await this.loadGuildData())();
      console.log("Configuring bot status... ");
      this.editStatus("online", config.game);
      console.log("Bot ready!");

      setInterval(this.runScheduler, 60 * 60 * 1000);
    });
  }

  public get db() {
    return this._db;
  }

  public get redisClient() {
    return this._redisClient;
  }

  public get eventScheduler() {
    return this._eventScheduler;
  }

  public get calendarLock() {
    return this._calendarLock;
  }

  public loadControllers(controllers: CommandController[]) {
    for (const controller of controllers) {
      this.controllers.push(controller);
      controller.registerCommands();
    }
  }

  public loadEventHandlers(): void {
    this.on("guildCreate", async (guild) => {
      try {
        const newGuild: CalendarDocument = new Calendar({
          _id: guild.id,
          prefix: config.prefix
        });
        await newGuild.save();
      } catch (err) {
        winston.error("guildCreate handler error", err);
      }
    });

    this.on("guildDelete", async (guild) => {
      try {
        const calendar: CalendarDocument = await Calendar.findByIdAndRemove(guild.id).exec();
        const scheduler: EventScheduler = this.eventScheduler;
        for (const event of calendar.events) {
          scheduler.unscheduleEvent(event);
        }
      } catch (err) {
        winston.error("guildDelete handler error", err);
      }
    });

    this.on("guildMemberRemove", async (guild, member) => {
      try {
        const calendar: CalendarDocument = await Calendar.findById(guild.id).exec();
        for (const perm of calendar.permissions) {
          const index: number = perm.deniedUsers.findIndex((id) => id === member.id);
          if (index >= 0) {
            perm.deniedUsers.splice(index, 1);
          }
        }

        await calendar.save();
      } catch (err) {
        winston.error("guildMemberRemove handler error", err);
      }
    });

    this.on("guildRoleDelete", async (guild, role) => {
      try {
        const calendar: CalendarDocument = await Calendar.findById(guild.id).exec();
        for (const perm of calendar.permissions) {
          const index: number = perm.deniedRoles.findIndex((id) => id === role.id);
          if (index >= 0) {
            perm.deniedRoles.splice(index, 1);
          }
        }

        await calendar.save();
      } catch (err) {
        winston.error("guildRoleDelete handler error", err);
      }
    });
  }

  public async loadGuildData(): Promise<void> {
    try {
      const clientGuildIDs: string[] = new Array<string>();
      for (const guildID in this.guildShardMap) {
        if (this.guildShardMap.hasOwnProperty(guildID)) {
          const shardID: number = this.guildShardMap[guildID];
          if (shardID >= this.options.firstShardID && shardID <= this.options.lastShardID) {
            clientGuildIDs.push(guildID);
          }
        }
      }
      const calendars: CalendarDocument[] = await Calendar.find({
        _id: { $in: clientGuildIDs }
      }).exec();
      for (const calendar of calendars) {
        const prefixes: string[] = [calendar.prefix, "@mention "];
        this.registerGuildPrefix(calendar._id, prefixes);
        this.eventScheduler.scheduleUpcomingEvents(calendar);
      }
    } catch (err) {
      winston.error("Prefix load error", err);
    }
  }

  public runScheduler = async (): Promise<void> => {
    try {
      const clientGuildIDs: string[] = new Array<string>();
      for (const guildID in this.guildShardMap) {
        if (this.guildShardMap.hasOwnProperty(guildID)) {
          const shardID: number = this.guildShardMap[guildID];
          if (shardID >= this.options.firstShardID && shardID <= this.options.lastShardID) {
            clientGuildIDs.push(guildID);
          }
        }
      }
      const calendars: CalendarDocument[] = await Calendar.find({
        _id: { $in: clientGuildIDs }
      }).exec();
      for (const calendar of calendars) {
        this.eventScheduler.scheduleUpcomingEvents(calendar);
      }
    } catch (err) {
      winston.error("Timed scheduler run error", err);
    }
  }
}

export default SchedulerBot;
