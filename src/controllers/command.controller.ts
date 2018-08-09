import { CommandOptions } from "eris";
import { SchedulerBot } from "../classes/schedulerbot.class";

export abstract class CommandController {
  protected bot: SchedulerBot;
  protected commandOptions: CommandOptions;

  constructor(bot: SchedulerBot) {
    this.bot = bot;
  }

  public abstract registerCommands(): boolean;
}

export default CommandController;
