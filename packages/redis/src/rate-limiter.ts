import { RedisClient } from './client';

export class RateLimiter {
  private client: RedisClient;
  private defaultWindow: number;
  private defaultMaxRequests: number;

  constructor(config?: {
    defaultWindow?: number;
    defaultMaxRequests?: number;
  }) {
    this.client = RedisClient.getInstance();
    this.defaultWindow = config?.defaultWindow || 60;
    this.defaultMaxRequests = config?.defaultMaxRequests || 100;
  }

  async checkLimit(
    key: string,
    maxRequests?: number,
    window?: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const windowSeconds = window || this.defaultWindow;
    const max = maxRequests || this.defaultMaxRequests;

    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Use Redis sorted set for rate limiting
    const client = this.client.getClient();
    const multi = client.multi();

    // Remove old entries
    multi.zremrangebyscore(redisKey, 0, windowStart);

    // Add current request
    multi.zadd(redisKey, now, `${now}`);

    // Count requests in window
    multi.zcount(redisKey, windowStart, now);

    // Set expiry on the key
    multi.expire(redisKey, windowSeconds * 2);

    const results = await multi.exec();
    const count = results[2][1] as number;

    const allowed = count <= max;
    const remaining = Math.max(0, max - count);
    const resetAt = new Date(now + windowSeconds * 1000);

    return { allowed, remaining, resetAt };
  }

  async checkMultipleLimit(
    keys: string[],
    maxRequests: number,
    window?: number
  ): Promise<boolean> {
    const checks = await Promise.all(
      keys.map(key => this.checkLimit(key, maxRequests, window))
    );
    return checks.every(check => check.allowed);
  }

  async resetLimit(key: string): Promise<void> {
    await this.client.del(`ratelimit:${key}`);
  }

  async getUsage(key: string, window?: number): Promise<number> {
    const windowSeconds = window || this.defaultWindow;
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const client = this.client.getClient();
    const count = await client.zcount(redisKey, windowStart, now);
    return count;
  }

  async incrementUsage(key: string, window?: number): Promise<number> {
    const windowSeconds = window || this.defaultWindow;
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const client = this.client.getClient();
    const multi = client.multi();

    multi.zremrangebyscore(redisKey, 0, windowStart);
    multi.zadd(redisKey, now, `${now}`);
    multi.zcount(redisKey, windowStart, now);
    multi.expire(redisKey, windowSeconds * 2);

    const results = await multi.exec();
    return results[2][1] as number;
  }
}