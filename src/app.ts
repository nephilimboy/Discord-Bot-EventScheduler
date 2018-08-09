import * as dotenv from "dotenv";
import * as mongoose from "mongoose";

const express = require("express");
const app = express();

import {SchedulerBot} from "./classes/schedulerbot.class";

dotenv.config();

(mongoose as any).Promise = global.Promise;

// Only setup Raven for prod
// if (process.env.NODE_ENV === "production") {
//   raven.config(process.env.SENTRY_DSN).install();
// }

const bot: SchedulerBot = new SchedulerBot();
app.listen(process.env.PORT || 5000, () => console.log("bot started at 5000!"));
bot.on("dbconnect", () => bot.connect())