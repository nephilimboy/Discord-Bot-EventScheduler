/* tslint:disable:no-eval */
import { CommandOptions, Message } from "eris";
import { inspect, promisify } from "util";
const execFile = promisify(require("child_process").execFile); // tslint:disable-line

import { CommandError } from "../classes/command-error.class";
import { SchedulerBot } from "../classes/schedulerbot.class";
import { config } from "../config/bot.config";
import { CommandController } from "./command.controller";

export class AdminController extends CommandController {
  protected commandOptions: CommandOptions;

  constructor(bot: SchedulerBot) {
    super(bot);
    this.commandOptions = {
      guildOnly: true,
      requirements: {
        userIDs: [config.adminId]
      }
    };
  }

  public adminCheck(msg: Message, args: string[]): string {
    return "Yes";
  }

  public forceError = (msg: Message, args: string[]): string | void => {
    try {
      throw new Error("Test error");
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public eval = (msg: Message, args: string[]): string => {
    if (msg.author.id !== config.adminId) { return; } // safety
    try {
      const code = args.join(" ");
      let evaled = eval(code);

      if (typeof evaled !== "string") {
        evaled = inspect(evaled);
      }

      let output: string = "```js\n" + this.clean(evaled) + "\n```";
      if (output.length > 1990) {
        output = output.substr(0, 1986);
        output += "\nTruncated\n```";
      }
      return output;
    } catch (err) {
      return `\`ERROR\` \`\`\`xl\n${this.clean(err)}\n\`\`\``;
    }
  }

  public shell = async (msg: Message, args: string[]): Promise<void> => {
    if (msg.author.id !== config.adminId) { return; } // safety
    const outputMessage: Message = await this.bot.createMessage(msg.channel.id, "Executing...");
    try {
      const { stdout, stderr } = await execFile(args[0], args.slice(1));
      let finalOutput: string = "";
      if (stdout) { finalOutput += "stdout:\n```bash\n" + this.clean(stdout) + "\n```"; }
      if (stderr) { finalOutput += "stderr:\n```bash\n" + this.clean(stderr) + "\n```"; }
      if (finalOutput.length > 1990) {
        finalOutput = finalOutput.substr(0, 1986);
        finalOutput += "\nTruncated\n```";
      }
      outputMessage.edit(finalOutput);
    } catch (err) {
      outputMessage.edit(`ERROR:\n\`\`\`\n${err}\n\`\`\``);
    }
  }

  public registerCommands(): boolean {
    this.bot.registerCommand("admincheck", this.adminCheck, this.commandOptions);
    this.bot.registerCommand("forceerror", this.forceError, this.commandOptions);
    this.bot.registerCommand("eval", this.eval, this.commandOptions);
    this.bot.registerCommand("shell", this.shell, this.commandOptions);
    return true;
  }

  private clean(evalResult: any): string {
    if (typeof(evalResult) === "string") {
      return evalResult.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    }
    return evalResult;
  }
}

export default AdminController;
