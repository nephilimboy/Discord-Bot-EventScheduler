import { Document, Model, model, Schema, Types } from "mongoose";

import { Event } from "../interfaces/event.interface";

export interface EventDocument extends Event, Document {
  _id: Types.ObjectId;
}

// tslint:disable-next-line
export let EventSchema: Schema = new Schema({
  description: String,
  endDate: Date,
  name: String,
  repeat: String,
  startDate: Date
});

// tslint:disable-next-line
export let EventModel: Model<EventDocument> = model<EventDocument>("Event", EventSchema);
export default EventModel;
