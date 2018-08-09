import { Types } from "mongoose";

export interface Perms {
  _id: Types.ObjectId;
  node: string;
  deniedRoles: string[];
  deniedUsers: string[];
}

export default Perms;
