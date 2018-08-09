import { BotConfig } from "../interfaces/bot-config.interface";
const packageFile: any = require("../../package.json"); // tslint:disable-line

export const config: BotConfig = {
  prefix: "+",
  game: {
    name: `+help | v${packageFile.version} | @nephilimboy`
  },
  adminId: "1234567890123458"
};
export default config;
