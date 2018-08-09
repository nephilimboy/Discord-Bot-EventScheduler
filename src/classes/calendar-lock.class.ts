import { RedisClient } from "redis";
import * as redisLock from "redislock";

export class CalendarLock {
  private redisClient: RedisClient;

  public constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  public async acquire(guildID: string): Promise<any> {
    const lock = redisLock.createLock(this.redisClient, {
      delay: 50,
      retries: -1,
      timeout: 5000
    });
    await lock.acquire(guildID);
    return lock;
  }
}

export default CalendarLock;
