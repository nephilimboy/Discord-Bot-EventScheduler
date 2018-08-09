import * as dotenv from "dotenv";
import * as mongoose from "mongoose";
import * as raven from "raven";

import { SchedulerBot } from "./classes/schedulerbot.class";

dotenv.config();

(mongoose as any).Promise = global.Promise;

// Only setup Raven for prod
if (process.env.NODE_ENV === "production") {
  raven.config(process.env.SENTRY_DSN).install();
}

const bot: SchedulerBot = new SchedulerBot();

bot.on("dbconnect", () => bot.connect());
