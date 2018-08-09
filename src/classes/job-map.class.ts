import { Types } from "mongoose";
import { Job } from "node-schedule";

export class JobMap {
  private jobs: Map<string, Job>;

  constructor() {
    this.jobs = new Map<string, Job>();
  }

  public get(key: Types.ObjectId): Job {
    return this.jobs.get(key.toHexString());
  }

  public set(key: Types.ObjectId, value: Job): boolean {
    if (this.jobs.set(key.toHexString(), value)) { return true; }
    return false;
  }

  public delete(key: Types.ObjectId): boolean {
    return this.jobs.delete(key.toHexString());
  }
}

export default JobMap;
