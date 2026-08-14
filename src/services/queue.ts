import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis({
  host: process.env.REDIS_HOST || 'ofertas-redis',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

export const publicationQueue = new Queue('publications', { connection });

export async function enqueuePublication(publicationId: string, delayMs = 0) {
  await publicationQueue.add(
    'send-publication',
    { publicationId },
    { delay: delayMs, attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );
}
