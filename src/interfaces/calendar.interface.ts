import { EventDocument } from "../models/event.model";
import { Perms } from "./perms.interface";

export interface Calendar {
  timezone: string;
  events: EventDocument[];
  prefix: string;
  defaultChannel: string;
  permissions: Perms[];
}
