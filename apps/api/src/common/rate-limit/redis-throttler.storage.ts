import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage, ThrottlerStorageRecord } from '@nestjs/throttler';
import Redis from 'ioredis';

/**
 * Distributed throttler storage for multi-instance deployments.
 * Uses Redis INCR + PEXPIRE so all API instances share one counter.
 */
@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly redis: Redis;
  private readonly keyPrefix: string;

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    this.keyPrefix = config.get<string>('REDIS_THROTTLE_PREFIX') || 'assetflow:throttle';

    this.redis = new Redis(redisUrl || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (attempt) => Math.min(attempt * 100, 2000),
    });
  }

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const redisKey = `${this.keyPrefix}:${key}`;
    const count = await this.redis.incr(redisKey);

    if (count === 1) {
      await this.redis.pexpire(redisKey, ttl);
    }

    const ttlMs = await this.redis.pttl(redisKey);
    return {
      totalHits: count,
      timeToExpire: Math.max(ttlMs, 0),
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
