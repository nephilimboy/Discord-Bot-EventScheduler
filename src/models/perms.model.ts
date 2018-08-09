import { Document, Model, model, Schema, Types } from "mongoose";

import { Perms } from "../interfaces/perms.interface";

export interface PermsDocument extends Perms, Document {
  _id: Types.ObjectId;
}

// tslint:disable-next-line
export let PermsSchema: Schema = new Schema({
  deniedRoles: [String],
  deniedUsers: [String],
  node: String
});

// tslint:disable-next-line
export let PermsModel: Model<PermsDocument> = model<PermsDocument>("Perms", PermsSchema);
export default PermsModel;
