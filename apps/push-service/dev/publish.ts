/**
 * Publishes demo events directly to RabbitMQ, e.g. while the harness is stopped: npx tsx apps/push-service/dev/publish.ts 5
 */
import { createClient } from 'redis';
import { wrapRedisClient } from '../src/buffer';
import { config } from './config';
import { createPublisher } from './publisher';

async function run() {
  const count = parseInt(process.argv[2] || '1');
  const redisClient = createClient(config.redisUrl);
  const redis = wrapRedisClient(redisClient);
  const publisher = await createPublisher();

  for (let i = 0; i < count; i++) {
    const seq = await redis.call('INCR', 'demo:seq');
    const id = await publisher.publish({
      namespace: config.namespace,
      name: 'item-updated',
      context: { itemId: `item-${Number(seq) % 3}` },
      payload: { seq, publishedAt: new Date().toISOString(), source: 'cli' },
    });
    console.log(`Published seq ${seq} (ID: ${id})`);
  }

  await publisher.close();
  await redis.quit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
