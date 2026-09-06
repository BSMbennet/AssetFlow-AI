import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface RedisThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
}

const INCREMENT_WITH_EXPIRY = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  local ttl = redis.call('PTTL', KEYS[1])
  return { count, ttl }
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly redis: Redis;
  private readonly keyPrefix: string;

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (!redisUrl && config.get<string>('NODE_ENV') === 'production') {
      throw new Error('REDIS_URL is required in production for distributed throttling');
    }
    this.keyPrefix = config.get<string>('REDIS_THROTTLE_PREFIX') || 'assetflow:throttle';
    this.redis = new Redis(redisUrl || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (attempt) => Math.min(attempt * 100, 2000),
    });
  }

  async increment(key: string, ttl: number): Promise<RedisThrottlerStorageRecord> {
    const redisKey = `${this.keyPrefix}:${key}`;
    const [totalHits, timeToExpire] = (await this.redis.eval(
      INCREMENT_WITH_EXPIRY,
      1,
      redisKey,
      Math.max(1, Math.floor(ttl)),
    )) as [number, number];

    return {
      totalHits: Number(totalHits),
      timeToExpire: Math.max(Number(timeToExpire), 0),
    };
  }
}
