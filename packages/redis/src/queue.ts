import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';
import { QueueOptions, JobData, JobResult } from './types';

export class QueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private connection: Redis;

  constructor(config?: { redisUrl?: string }) {
    this.connection = new Redis(config?.redisUrl || 'redis://localhost:6379');
  }

  createQueue(name: string, options?: QueueOptions): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: options?.removeOnComplete || false,
        removeOnFail: options?.removeOnFail || false,
        ...options?.defaultJobOptions,
      },
    });

    this.queues.set(name, queue);

    // Create scheduler for this queue
    const scheduler = new QueueScheduler(name, {
      connection: this.connection,
    });

    return queue;
  }

  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
      jobId?: string;
    }
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobName, data, {
      delay: options?.delay || 0,
      priority: options?.priority,
      attempts: options?.attempts,
      jobId: options?.jobId,
    });

    return job.id!;
  }

  addWorker<T, R>(
    queueName: string,
    handler: (job: { data: T; id: string }) => Promise<R>,
    options?: {
      concurrency?: number;
    }
  ): void {
    if (this.workers.has(queueName)) {
      return;
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        const result = await handler({
          data: job.data as T,
          id: job.id!,
        });
        return result;
      },
      {
        connection: this.connection,
        concurrency: options?.concurrency || 1,
      }
    );

    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed in ${queueName}`);
    });

    worker.on('failed', (job, error) => {
      console.error(`❌ Job ${job?.id} failed in ${queueName}:`, error);
    });

    this.workers.set(queueName, worker);
  }

  async getJob(queueName: string, jobId: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue.getJob(jobId);
  }

  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.pause();
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.resume();
  }

  async cleanQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.clean(0, 0);
  }

  async closeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.close();
      this.queues.delete(queueName);
    }

    const worker = this.workers.get(queueName);
    if (worker) {
      await worker.close();
      this.workers.delete(queueName);
    }
  }

  async closeAll(): Promise<void> {
    const queueNames = Array.from(this.queues.keys());
    await Promise.all(queueNames.map(name => this.closeQueue(name)));
    await this.connection.quit();
  }
}