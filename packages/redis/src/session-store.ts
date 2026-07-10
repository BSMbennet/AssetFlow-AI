import { RedisClient } from './client';

export interface SessionData {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  lastActivityAt: Date;
}

export class SessionStore {
  private client: RedisClient;
  private defaultTTL: number;

  constructor(config?: { defaultTTL?: number }) {
    this.client = RedisClient.getInstance();
    this.defaultTTL = config?.defaultTTL || 86400; // 24 hours
  }

  async createSession(sessionId: string, data: SessionData): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.set(key, JSON.stringify(data), this.defaultTTL);
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.lastActivityAt = new Date(parsed.lastActivityAt);
      return parsed;
    } catch {
      return null;
    }
  }

  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const existing = await this.getSession(sessionId);
    if (!existing) {
      throw new Error('Session not found');
    }

    const updated = {
      ...existing,
      ...data,
      lastActivityAt: new Date(),
    };

    const key = `session:${sessionId}`;
    await this.client.set(key, JSON.stringify(updated), this.defaultTTL);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.del(key);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const pattern = `session:*`;
    const keys = await this.client.keys(pattern);

    const sessionKeys = await Promise.all(
      keys.map(async (key) => {
        const data = await this.client.get(key);
        if (!data) return null;
        try {
          const parsed = JSON.parse(data);
          if (parsed.userId === userId) {
            return key;
          }
        } catch {
          return null;
        }
        return null;
      })
    );

    const validKeys = sessionKeys.filter((key): key is string => key !== null);
    if (validKeys.length > 0) {
      await Promise.all(validKeys.map(key => this.client.del(key)));
    }
  }

  async getActiveSessions(userId: string): Promise<string[]> {
    const pattern = `session:*`;
    const keys = await this.client.keys(pattern);

    const sessionKeys = await Promise.all(
      keys.map(async (key) => {
        const data = await this.client.get(key);
        if (!data) return null;
        try {
          const parsed = JSON.parse(data);
          if (parsed.userId === userId) {
            return key.replace('session:', '');
          }
        } catch {
          return null;
        }
        return null;
      })
    );

    return sessionKeys.filter((key): key is string => key !== null);
  }

  async touchSession(sessionId: string): Promise<void> {
    const existing = await this.getSession(sessionId);
    if (!existing) {
      throw new Error('Session not found');
    }

    const key = `session:${sessionId}`;
    await this.client.expire(key, this.defaultTTL);
  }

  async getSessionCount(): Promise<number> {
    const keys = await this.client.keys('session:*');
    return keys.length;
  }

  async cleanupExpired(): Promise<number> {
    const pattern = 'session:*';
    const keys = await this.client.keys(pattern);
    const count = keys.length;

    // Redis will automatically expire keys based on TTL
    // This method just returns the current session count
    return count;
  }
}