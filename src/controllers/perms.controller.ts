import { Collection, GuildChannel, Member, Message, Role } from "eris";
import * as FuzzySet from "fuzzyset.js";

import { CommandError } from "../classes/command-error.class";
import { FlagParser } from "../classes/flag-parser.class";
import { SchedulerBot } from "../classes/schedulerbot.class";
import { Perms } from "../interfaces/perms.interface";
import { CalendarDocument, CalendarModel as Calendar } from "../models/calendar.model";
import { CommandController } from "./command.controller";
// tslint:disable-next-line
const STRINGS: any = require("../resources/strings.resource.json");

export class PermsController extends CommandController {
  public static readonly nodes: string[] = [
    "event.create",
    "event.update",
    "event.delete",
    "event.list",
    "ping",
    "prefix.show",
    "prefix.modify",
    "defaultchannel.show",
    "defaultchannel.modify",
    "timezone.show",
    "timezone.modify",
    "perms.modify",
    "perms.nodes",
    "perms.show"
  ];

  constructor(bot: SchedulerBot) {
    super(bot);
  }

  public modifyPerms = async (msg: Message, args: string[]): Promise<string> => {
    if (args.length < 4 || (args[0] !== "allow" && args[0] !== "deny")) {
      return `Usage: ${STRINGS.commandUsage.perms.modify}`;
    }
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();
      if (!calendar) { return STRINGS.commandResponses.timezoneNotSet; }
      if (!calendar.checkPerm("perms.modify", msg)) { return STRINGS.commandResponses.permissionDenied; }

      if (!PermsController.nodes.find((node) => args[1] === node)) { return STRINGS.commandResponses.nodeNotFound; }

      const flags: any = FlagParser.parse(args);
      if ((!flags.role && !flags.user) || Object.keys(flags).length < 2) {
        return `Usage: ${STRINGS.commandUsage.perms.modify}`;
      }

      let results: any[];
      if (flags.role && msg.roleMentions.length < 1) {
        results = this.findEntityNames((msg.channel as GuildChannel).guild.roles, flags.role);
      }
      else if (flags.user && msg.mentions.length < 1) {
        results = this.findEntityNames((msg.channel as GuildChannel).guild.members, flags.user);
      }

      if (flags.role && msg.roleMentions.length > 0) {
        this.setRolePermissionById(calendar, args[1], msg.roleMentions[0], args[0], msg);
      }
      else if (flags.user && msg.mentions.length > 0) {
        this.setUserPermissionById(calendar, args[1], msg.mentions[0].id, args[0], msg);
      }
      else if (results.length < 1) { return STRINGS.commandResponses.roleOrUserNotFound; }
      else if (results.length > 1) {
        let resultString: string = "```css\n";
        for (let i = 0; i < results.length; i++) {
          resultString = resultString + `${i + 1} : ${results[i][1]}\n`;
        }
        resultString = resultString + "```";
        msg.channel.createMessage("Select one.\n" + resultString);
        setTimeout(() => {
          this.bot.once("messageCreate", (message) => {
            let index = parseInt(message.content, 10);
            if (isNaN(index)) {
              return;
            }
            index = index - 1;
            if (flags.role) {
              this.setRolePermission(calendar, args[1], results[index][1], args[0], message);
            }
            else {
              this.setUserPermission(calendar, args[1], results[index][1], args[0], message);
            }
          });
        }, 1000);
      }
      else {
        if (flags.role) {
          this.setRolePermission(calendar, args[1], results[0][1], args[0], msg);
        }
        else {
          this.setUserPermission(calendar, args[1], results[0][1], args[0], msg);
        }
      }

      return STRINGS.commandResponses.permissionModifySuccess;
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public displayPermNodes = async (msg: Message, args: string[]): Promise<string> => {
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();
      if (!calendar) { return STRINGS.commandResponses.timezoneNotSet; }
      if (!calendar.checkPerm("perms.nodes", msg)) { return STRINGS.commandResponses.permissionDenied; }

      let nodes: string = "```css\n";
      for (const node of PermsController.nodes) {
        nodes = nodes + `${node}\n`;
      }
      nodes = nodes + "```";

      return nodes;
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public showPerm = async (msg: Message, args: string[]): Promise<string> => {
    if (args.length < 2) { return `Usage: ${STRINGS.commandUsage.perms.show}`; }
    try {
      const calendar: CalendarDocument = await Calendar.findById((msg.channel as GuildChannel).guild.id).exec();
      if (!calendar) { return STRINGS.commandResponses.timezoneNotSet; }
      if (!calendar.checkPerm("perms.show", msg)) { return STRINGS.commandResponses.permissionDenied; }

      const flags: any = FlagParser.parse(args);
      if ((!flags.node && !flags.role && !flags.user) || Object.keys(flags).length < 2) {
        return `Usage: ${STRINGS.commandUsage.perms.show}`;
      }

      if (flags.node) {
        if (!PermsController.nodes.find((node) => node === flags.node)) {
          return STRINGS.commandResponses.nodeNotFound;
        }
        const permNode: Perms = calendar.permissions.find((perm) => {
          return perm.node === flags.node;
        });

        let resultString: string = "```css\nNode: " + flags.node + "\nDenied Roles: ";
        if (!permNode || permNode.deniedRoles.length === 0) {
          resultString = resultString + "None";
        }
        else {
          for (let i = 0; i < permNode.deniedRoles.length; i++) {
            resultString = resultString + (msg.channel as GuildChannel).guild.roles.get(permNode.deniedRoles[i]).name;
            if (i < permNode.deniedRoles.length - 1) {
              resultString = resultString + ", ";
            }
          }
        }
        resultString = resultString + "\nDenied Users: ";
        if (!permNode || permNode.deniedUsers.length === 0) {
          resultString = resultString + "None";
        }
        else {
          for (let i = 0; i < permNode.deniedUsers.length; i++) {
            const user: Member = (msg.channel as GuildChannel).guild.members.get(permNode.deniedUsers[i]);
            resultString = resultString + `${user.username}#${user.discriminator}`;
            if (user.nick) {
              resultString = resultString + ` (${user.nick})`;
            }
            if (i < permNode.deniedUsers.length - 1) {
              resultString = resultString + ", ";
            }
          }
        }
        resultString = resultString + "\n```";

        return resultString;
      }
      else {
        let results;
        if (flags.role && msg.roleMentions.length < 1) {
          results = this.findEntityNames((msg.channel as GuildChannel).guild.roles, flags.role);
        }
        else if (flags.user && msg.mentions.length < 1) {
          results = this.findEntityNames((msg.channel as GuildChannel).guild.members, flags.user);
        }

        if (flags.role && msg.roleMentions.length > 0) {
          return this.displayRolePermissionsById(calendar, msg, msg.roleMentions[0]);
        }
        else if (flags.user && msg.mentions.length > 0) {
          return this.displayUserPermissionsById(calendar, msg, msg.mentions[0].id);
        }
        else if (results.length < 1) { return STRINGS.commandResponses.roleOrUserNotFound; }
        else if (results.length > 1) {
          let resultString: string = "```css\n";
          for (let i = 0; i < results.length; i++) {
            resultString = resultString + `${i + 1} : ${results[i][1]}\n`;
          }
          resultString = resultString + "```";

          msg.channel.createMessage("Select one.\n" + resultString);
          setTimeout(() => {
            // tslint:disable-next-line
            this.bot.once("messageCreate", (msg) => {
              let index = parseInt(msg.content, 10);
              if (isNaN(index)) {
                return;
              }
              index = index - 1;
              if (flags.role) {
                return this.displayRolePermissions(calendar, msg, results[index][1]);
              }
              else {
                return this.displayUserPermissions(calendar, msg, results[index][1]);
              }
            });
          }, 1000);
        }
        else {
          if (flags.role) {
            return this.displayRolePermissions(calendar, msg, results[0][1]);
          }
          else {
            return this.displayUserPermissions(calendar, msg, results[0][1]);
          }
        }
      }
    } catch (err) {
      return new CommandError(err, msg).toString();
    }
  }

  public registerCommands(): boolean {
    const permsCommand = this.bot.registerCommand("perms", this.modifyPerms);
    permsCommand.registerSubcommand("nodes", this.displayPermNodes);
    permsCommand.registerSubcommand("show", this.showPerm);
    return true;
  }

  private findEntityNames(entityCollection: Collection<Role> | Collection<Member>, targetName: string): any[] {
    const names: string[] = [];
    if (this.isRoleCollection(entityCollection)) {
      entityCollection.forEach((value, key, map) => {
        names.push(value.name);
      });
    }
    else {
      entityCollection.forEach((value, key, map) => {
        let result = `${value.username}#${value.discriminator}`;
        if (value.nick) {
          result += ` ${value.nick}`;
        }
        names.push(result);
      });
    }

    const fuzzyNames: any = FuzzySet(names);
    return fuzzyNames.get(targetName, null, 0.1);
  }

  private getRoleIdByName(roleCollection: Collection<Role>, roleName: string): string {
    return roleCollection.find((role) => {
      return role.name === roleName;
    }).id;
  }

  private getUserIdByName(userCollection: Collection<Member>, username: string): string {
    return userCollection.find((member) => {
      let fullName = `${member.username}#${member.discriminator}`;
      if (member.nick) {
        fullName = fullName + ` (${member.nick})`;
      }
      return fullName === username;
    }).id;
  }

  private setRolePermission = async (calendar: CalendarDocument,
                                     node: string,
                                     roleName: string,
                                     perm: string,
                                     msg: Message): Promise<boolean> => {
    const roleID: string = this.getRoleIdByName((msg.channel as GuildChannel).guild.roles, roleName);
    if (perm === "deny") {
      await calendar.denyRolePerm(roleID, node);
    }
    else {
      await calendar.allowRolePerm(roleID, node);
    }
    return true;
  }

  private setRolePermissionById = async (calendar: CalendarDocument,
                                         node: string,
                                         roleID: string,
                                         perm: string,
                                         msg: Message): Promise<boolean> => {
    if (perm === "deny") {
      await calendar.denyRolePerm(roleID, node);
    }
    else {
      await calendar.allowRolePerm(roleID, node);
    }
    return true;
  }

  private setUserPermission = async (calendar: CalendarDocument,
                                     node: string,
                                     username: string,
                                     perm: string,
                                     msg: Message): Promise<boolean> => {
    const userID: string = this.getUserIdByName((msg.channel as GuildChannel).guild.members, username);
    if (perm === "deny") {
      await calendar.denyUserPerm(userID, node);
    }
    else {
      await calendar.allowUserPerm(userID, node);
    }
    return true;
  }

  private setUserPermissionById = async (calendar: CalendarDocument,
                                         node: string,
                                         userID: string,
                                         perm: string,
                                         msg: Message): Promise<boolean> => {
    if (perm === "deny") {
      await calendar.denyUserPerm(userID, node);
    }
    else {
      await calendar.allowUserPerm(userID, node);
    }
    return true;
  }

  private displayRolePermissions = (calendar: CalendarDocument, msg: Message, roleName: string): string => {
    const roleId: string = this.getRoleIdByName((msg.channel as GuildChannel).guild.roles, roleName);
    let resultString: string = "```css\nRole: " + roleName + "\nDenied Nodes: ";
    const deniedNodes = [];
    for (const perm of calendar.permissions) {
      if (perm.deniedRoles.find((id) => id === roleId)) {
        deniedNodes.push(perm.node);
      }
    }

    if (deniedNodes.length === 0) {
      resultString = resultString + "None";
    }
    else {
      for (let i = 0; i < deniedNodes.length; i++) {
        resultString = resultString + deniedNodes[i];
        if (i < deniedNodes.length - 1) {
          resultString = resultString + ", ";
        }
      }
    }
    resultString = resultString + "\n```";

    return resultString;
  }

  private displayRolePermissionsById = (calendar: CalendarDocument, msg: Message, roleId: string): string => {
    let resultString: string = "```css\nRole ID: " + roleId + "\nDenied Nodes: ";
    const deniedNodes = [];
    for (const perm of calendar.permissions) {
      if (perm.deniedRoles.find((id) => id === roleId)) {
        deniedNodes.push(perm.node);
      }
    }

    if (deniedNodes.length === 0) {
      resultString = resultString + "None";
    }
    else {
      for (let i = 0; i < deniedNodes.length; i++) {
        resultString = resultString + deniedNodes[i];
        if (i < deniedNodes.length - 1) {
          resultString = resultString + ", ";
        }
      }
    }
    resultString = resultString + "\n```";

    return resultString;
  }

  private displayUserPermissions = (calendar: CalendarDocument, msg: Message, username: string): string => {
    const userId: string = this.getUserIdByName((msg.channel as GuildChannel).guild.members, username);
    let resultString: string = "```css\nUser: " + username + "\nDenied Nodes: ";
    const deniedNodes = [];
    for (const perm of calendar.permissions) {
      if (perm.deniedUsers.find((id) => id === userId)) {
        deniedNodes.push(perm.node);
      }
    }

    if (deniedNodes.length === 0) {
      resultString = resultString + "None";
    }
    else {
      for (let i = 0; i < deniedNodes.length; i++) {
        resultString = resultString + deniedNodes[i];
        if (i < deniedNodes.length - 1) {
          resultString = resultString + ", ";
        }
      }
    }
    resultString = resultString + "\n```";

    return resultString;
  }

  private displayUserPermissionsById = (calendar: CalendarDocument, msg: Message, userId: string): string => {
    let resultString: string = "```css\nUser ID: " + userId + "\nDenied Nodes: ";
    const deniedNodes = [];
    for (const perm of calendar.permissions) {
      if (perm.deniedUsers.find((id) => id === userId)) {
        deniedNodes.push(perm.node);
      }
    }

    if (deniedNodes.length === 0) {
      resultString = resultString + "None";
    }
    else {
      for (let i = 0; i < deniedNodes.length; i++) {
        resultString = resultString + deniedNodes[i];
        if (i < deniedNodes.length - 1) {
          resultString = resultString + ", ";
        }
      }
    }
    resultString = resultString + "\n```";

    return resultString;
  }

  private isRoleCollection(entityCollection: Collection<Role> | Collection<Member>)
  : entityCollection is Collection<Role> {
    return (entityCollection as Collection<Role>).random().name != null;
  }
}
