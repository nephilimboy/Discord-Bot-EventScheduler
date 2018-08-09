import { Command, Message } from "eris";

import { SchedulerBot } from "../classes/schedulerbot.class";
import { CommandController } from "./command.controller";
/* tslint:disable */
const STRINGS: any = require("../resources/strings.resource.json");
const HELP_EMBEDS: any = require("../resources/help-embeds.resource.json");
/* tslint:enable */

export class HelpController extends CommandController {
  constructor(bot: SchedulerBot) {
    super(bot);
  }

  public help = (msg: Message, args: string[]): void => {
    this.bot.createMessage(msg.channel.id, { embed: HELP_EMBEDS.help });
  }

  public initHelp = (msg: Message, args: string[]): void => {
    this.bot.createMessage(msg.channel.id, { embed: HELP_EMBEDS.commands.init });
  }

  public eventHelp = (msg: Message, args: string[]): void => {
    this.bot.createMessage(msg.channel.id, { embed: HELP_EMBEDS.commands.event });
  }

  public permsHelp = (msg: Message, args: string[]): void => {
    this.bot.createMessage(msg.channel.id, { embed: HELP_EMBEDS.commands.perms });
  }

  public prefixHelp = (msg: Message, args: string[]): void => {
    this.bot.createMessage(msg.channel.id, { embed: HELP_EMBEDS.commands.prefix });
  }

  public settingsHelp = (msg: Message, args: string[]): void => {
    this.bot.createMessage(msg.channel.id, { embed: HELP_EMBEDS.commands.settings });
  }

  public pingHelp = (msg: Message, args: string[]): string => {
    return `Usage: ${STRINGS.commandUsage.ping}`;
  }

  public infoHelp = (msg: Message, args: string[]): string => {
    return `Usage: ${STRINGS.commandUsage.info}`;
  }

  public supportHelp = (msg: Message, args: string[]): string => {
    return `Usage: ${STRINGS.commandUsage.support}`;
  }

  public inviteHelp = (msg: Message, args: string[]): string => {
    return `Usage: ${STRINGS.commandUsage.invite}`;
  }

  public registerCommands(): boolean {
    const helpCommand: Command = this.bot.registerCommand("help", this.help);
    helpCommand.registerSubcommand("init", this.initHelp);
    helpCommand.registerSubcommand("event", this.eventHelp);
    helpCommand.registerSubcommand("perms", this.permsHelp);
    helpCommand.registerSubcommand("prefix", this.prefixHelp);
    helpCommand.registerSubcommand("settings", this.settingsHelp);
    helpCommand.registerSubcommand("ping", this.pingHelp);
    helpCommand.registerSubcommand("info", this.infoHelp);
    helpCommand.registerSubcommand("support", this.supportHelp);
    helpCommand.registerSubcommand("invite", this.inviteHelp);
    return true;
  }
}

export default HelpController;
