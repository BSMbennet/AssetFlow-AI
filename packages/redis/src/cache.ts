import { RedisClient } from './client';
import { CacheOptions } from './types';

export class CacheService {
  private client: RedisClient;
  private defaultTTL: number;

  constructor(config?: { defaultTTL?: number }) {
    this.client = RedisClient.getInstance();
    this.defaultTTL = config?.defaultTTL || 3600;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.set(key, serialized, ttl || this.defaultTTL);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.client.del(key)));
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    const result = await this.client.getClient().incrby(key, by);
    return result;
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    const result = await this.client.getClient().decrby(key, by);
    return result;
  }

  // Cache with expiration
  async setWithExpiry<T>(key: string, value: T, expiresAt: Date): Promise<void> {
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (ttl > 0) {
      await this.set(key, value, ttl);
    }
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await this.client.getClient().mget(keys);
    return values.map(val => {
      if (!val) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    });
  }

  async mset<T>(entries: Record<string, T>, ttl?: number): Promise<void> {
    const pipeline = this.client.getClient().pipeline();
    for (const [key, value] of Object.entries(entries)) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        pipeline.set(key, serialized, 'EX', ttl);
      } else {
        pipeline.set(key, serialized);
      }
    }
    await pipeline.exec();
  }
}