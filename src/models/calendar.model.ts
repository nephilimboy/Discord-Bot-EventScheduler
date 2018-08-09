import { GuildChannel, Message } from "eris";
import * as moment from "moment-timezone";
import { Document, Model, model, Schema } from "mongoose";

import { EventParser } from "../classes/event-parser.class";
import { Calendar } from "../interfaces/calendar.interface";
import { Event as EventInterface } from "../interfaces/event.interface";
import { EventDocument, EventModel as Event, EventSchema } from "./event.model";
import { PermsDocument, PermsModel as Perms, PermsSchema } from "./perms.model";

export interface CalendarDocument extends Calendar, Document {
  _id: string;
  addEvent(event: EventInterface): Promise<EventDocument>;
  deleteEvent(eventIndex: number): Promise<EventDocument>;
  scheduledDeleteEvent(eventId: string): Promise<boolean>;
  updateEvent(eventIndex: number, event: EventInterface): Promise<EventDocument>;
  repeatUpdateEvent(eventIndex: number): Promise<EventDocument>;
  updatePrefix(prefix: string): Promise<any>;
  updateDefaultChannel(channelID: string): Promise<any>;
  updateTimezone(timezone: string): Promise<boolean>;
  denyRolePerm(roleId: string, node: string): Promise<any>;
  denyUserPerm(userId: string, node: string): Promise<any>;
  allowRolePerm(roleId: string, node: string): Promise<any>;
  allowUserPerm(userId: string, node: string): Promise<any>;
  checkPerm(node: string, msg: Message): boolean;
}

// tslint:disable-next-line
export let CalendarSchema: Schema = new Schema({
  _id: String,
  defaultChannel: String,
  events: [EventSchema],
  permissions: [PermsSchema],
  prefix: String,
  timezone: String
}, {
  _id: false
});

CalendarSchema.methods.addEvent = async function(event: EventInterface): Promise<EventDocument> {
  const newEvent: Document = new Event({
    description: event.description,
    endDate: event.endDate,
    name: event.name,
    repeat: event.repeat,
    startDate: event.startDate
  });

  let eventIndex: number;

  if (this.events.length === 0) {
    this.events.push(event);
    eventIndex = this.events.length - 1;
  }
  else {
    for (let i = 0; i < this.events.length; i++) {
      const element = this.events[i];
      if (moment(element.startDate).isSameOrAfter(event.startDate)) {
        this.events.splice(i, 0, newEvent);
        eventIndex = i;
        break;
      }
      if (i === this.events.length - 1) {
        this.events.push(newEvent);
        eventIndex = this.events.length - 1;
        break;
      }
    }
  }

  await this.save();
  return this.events[eventIndex];
};

CalendarSchema.methods.deleteEvent = async function(eventIndex: number): Promise<EventDocument> {
  if (eventIndex >= 0 && eventIndex < this.events.length) {
    const event: EventDocument = this.events.splice(eventIndex, 1);
    await this.save();
    return event[0];
  }
  return Promise.reject("Event not found");
};

CalendarSchema.methods.scheduledDeleteEvent = async function(eventId: string): Promise<EventDocument> {
  let repeatEvent: EventDocument = null;
  const index: number = this.events.findIndex((event) => {
    return event._id.toString() === eventId;
  });
  if (!this.events[index].repeat) {
    this.events.splice(index, 1);
  }
  else {
    repeatEvent = await this.repeatUpdateEvent(index);
  }
  await this.save();
  return repeatEvent;
};

CalendarSchema.methods.updateEvent = async function(eventIndex: number, event: EventInterface): Promise<EventDocument> {
  if (eventIndex >= 0 && eventIndex < this.events.length) {
    const eventArray: EventDocument[] = this.events.splice(eventIndex, 1);
    const existingEvent: EventDocument = eventArray[0];

    existingEvent.name = event.name || existingEvent.name;
    existingEvent.startDate = event.startDate ? event.startDate : existingEvent.startDate;
    existingEvent.endDate = event.endDate ? event.endDate : existingEvent.endDate;
    existingEvent.description = event.description || existingEvent.description;
    if (event.repeat && event.repeat === "off") {
      existingEvent.repeat = null;
    }
    else {
      existingEvent.repeat = event.repeat || existingEvent.repeat;
    }

    if (this.events.length === 0) {
      this.events.push(existingEvent);
    }
    else {
      for (let i = 0; i < this.events.length; i++) {
        if (moment(this.events[i].startDate).isSameOrAfter(existingEvent.startDate)) {
          this.events.splice(i, 0, existingEvent);
          break;
        }
        if (i === this.events.length - 1) {
          this.events.push(existingEvent);
          break;
        }
      }
    }

    await this.save();
    return existingEvent;
  }
  return Promise.reject("Event not found");
};

CalendarSchema.methods.repeatUpdateEvent = async function(eventIndex: number): Promise<EventDocument> {
  if (eventIndex >= 0 && eventIndex < this.events.length) {
    const eventArray: EventDocument[] = this.events.splice(eventIndex, 1);
    const event: EventDocument = eventArray[0];

    if (event.repeat === "m") {
      event.startDate = moment(event.startDate).add(1, "M").toDate();
      event.endDate = moment(event.endDate).add(1, "M").toDate();
    }
    else {
      event.startDate = moment(event.startDate).add(1, (event.repeat as moment.DurationInputArg2)).toDate();
      event.endDate = moment(event.endDate).add(1, (event.repeat as moment.DurationInputArg2)).toDate();
    }

    if (this.events.length === 0) {
      this.events.push(event);
    }
    else {
      for (let i = 0; i < this.events.length; i++) {
        if (moment(this.events[i].startDate).isSameOrAfter(event.startDate)) {
          this.events.splice(i, 0, event);
          break;
        }
        if (i === this.events.length - 1) {
          this.events.push(event);
          break;
        }
      }
    }

    await this.save();
    return event;
  }
  return Promise.reject("Event not found");
};

CalendarSchema.methods.updatePrefix = function(prefix: string): Promise<any> {
  this.prefix = prefix;
  return this.save();
};

CalendarSchema.methods.updateDefaultChannel = function(channelID: string): Promise<any> {
  this.defaultChannel = channelID;
  return this.save();
};

CalendarSchema.methods.updateTimezone = async function(timezone: string): Promise<boolean> {
  if (moment.tz.zone(timezone) === null) {
    return Promise.reject("Timezone not found");
  }
  else {
    // Check if events end up in the past in the new timezone
    if (this.events.length > 0) {
      const now = moment();
      const earliestEvent: EventDocument = this.events[0];
      const newStartMoment: moment.Moment = EventParser.getOffsetMoment(moment(earliestEvent.startDate),
                                                                        timezone,
                                                                        this.timezone);
      if (now.diff(newStartMoment) > 0) {
        return false;
      }
      // Adjust all event dates
      for (const event of this.events) {
        event.startDate = EventParser.getOffsetMoment(moment(event.startDate), timezone, this.timezone).toDate();
        event.endDate = EventParser.getOffsetMoment(moment(event.endDate), timezone, this.timezone).toDate();
      }
    }
    this.timezone = timezone;
    await this.save();
    return true;
    // NOTE: The event scheduler should reschedule all events after calling this method
  }
};

CalendarSchema.methods.denyRolePerm = function(roleId: string, node: string): Promise<any> {
  let index: number = this.permissions.findIndex((perm) => {
    return perm.node === node;
  });
  if (index < 0) {
    this.permissions.push(new Perms({
      deniedRoles: [],
      deniedUsers: [],
      node
    }));
    index = this.permissions.length - 1;
  }

  if (!this.permissions[index].deniedRoles.find((id) => roleId === id)) {
    this.permissions[index].deniedRoles.push(roleId);
  }

  return this.save();
};

CalendarSchema.methods.denyUserPerm = function(userId: string, node: string): Promise<any> {
  let index: number = this.permissions.findIndex((perm) => {
    return perm.node === node;
  });
  if (index < 0) {
    this.permissions.push(new Perms({
      deniedRoles: [],
      deniedUsers: [],
      node
    }));
    index = this.permissions.length - 1;
  }

  if (!this.permissions[index].deniedUsers.find((id) => userId === id)) {
    this.permissions[index].deniedUsers.push(userId);
  }

  return this.save();
};

CalendarSchema.methods.allowRolePerm = function(roleId: string, node: string): Promise<any> {
  const index: number = this.permissions.findIndex((perm) => {
    return perm.node === node;
  });

  if (index >= 0) {
    const roleIndex: number = this.permissions[index].deniedRoles.findIndex((id) => roleId === id);
    if (roleIndex >= 0) {
      this.permissions[index].deniedRoles.splice(roleIndex, 1);
    }
  }

  return this.save();
};

CalendarSchema.methods.allowUserPerm = function(userId: string, node: string): Promise<any> {
  const index: number = this.permissions.findIndex((perm) => {
    return perm.node === node;
  });

  if (index >= 0) {
    const userIndex: number = this.permissions[index].deniedUsers.findIndex((id) => userId === id);
    if (userIndex >= 0) {
      this.permissions[index].deniedUsers.splice(userIndex, 1);
    }
  }

  return this.save();
};

CalendarSchema.methods.checkPerm = function(node: string, msg: Message): boolean {
  const channel: GuildChannel = msg.channel as GuildChannel;
  if (channel.guild.ownerID === msg.member.id) {
    return true;
  }

  const perm: PermsDocument = this.permissions.find((permission) => permission.node === node);
  if (perm) {
    if (perm.deniedUsers.find((id) => id === msg.member.id)) { // Check if user is denied
      return false;
    }
    for (const roleId of perm.deniedRoles) { // Check if user's roles are denied
      if (msg.member.roles.find((id) => id === roleId)) {
        return false;
      }
    }
  }

  return true; // Return true if user and user's roles are all not denied
};

// tslint:disable-next-line
export let CalendarModel: Model<CalendarDocument> = model<CalendarDocument>("Calendar", CalendarSchema);
export default CalendarModel;
