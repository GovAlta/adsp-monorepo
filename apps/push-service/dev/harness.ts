/**
 * Local harness for the reliable event delivery PoC (CS-5398).
 *
 * Runs the real push-service stream router, replay buffer, buffer writer and tailer against local RabbitMQ and Redis,
 * with a stub tenant, stream configuration and anonymous access in place of the platform services (Keycloak,
 * tenant, configuration and directory). Serves a React demo page built with @abgov/adsp-event-client.
 *
 * See README.md in this folder.
 */
import { AdspId } from '@abgov/adsp-service-sdk';
import type { ConfigurationService, EventService, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { createAmqpEventService as createAmqpQueueService, createLogger } from '@core-services/core-common';
import compression = require('compression');
import { build } from 'esbuild';
import express = require('express');
import { createServer } from 'http';
import { Socket } from 'net';
import { join } from 'path';
import { createClient } from 'redis';
import { NEVER } from 'rxjs';
import { createAmqpEventService } from '../src/amqp';
import { BufferTailer, hasStreamInterest, RedisEventBuffer, startBufferWriter, wrapRedisClient } from '../src/buffer';
import { StreamEntity } from '../src/push';
import { createStreamRouter } from '../src/push/router';
import { config } from './config';
import { createPublisher } from './publisher';

const logger = createLogger('push-harness', process.env.LOG_LEVEL || 'info');
const tenantId = AdspId.parse(config.tenantId);

const streams: Record<string, StreamEntity> = {
  [config.streamId]: new StreamEntity(logger, tenantId, {
    id: config.streamId,
    name: 'Demo updates',
    description: 'Demo stream for the reliable delivery PoC.',
    publicSubscribe: true,
    subscriberRoles: [],
    events: [
      { namespace: config.namespace, name: 'item-updated' },
      { namespace: config.namespace, name: 'item-deleted' },
    ],
  }),
};

async function bundleDemo(): Promise<string> {
  const result = await build({
    entryPoints: [join(__dirname, 'demo', 'main.tsx')],
    bundle: true,
    write: false,
    format: 'esm',
    jsx: 'automatic',
    tsconfig: join(__dirname, '..', '..', '..', 'tsconfig.base.json'),
    define: { 'process.env.NODE_ENV': '"development"' },
    logLevel: 'warning',
  });
  return result.outputFiles[0].text;
}

async function start() {
  const app = express();
  const server = createServer(app);
  app.use(compression());
  app.use(express.json());

  const redisClient = createClient(config.redisUrl);
  const redis = wrapRedisClient(redisClient);
  const buffer = new RedisEventBuffer(logger, redis, { retentionMs: config.retentionMs, maxLength: 100000 });
  const tailer = new BufferTailer(logger, buffer);

  // Durable queue shared by all instances; events published while the harness is down wait here.
  const bufferQueue = await createAmqpQueueService({
    queue: config.bufferQueue,
    AMQP_HOST: config.amqpHost,
    AMQP_USER: config.amqpUser,
    AMQP_PASSWORD: config.amqpPassword,
    logger,
  });
  startBufferWriter(logger, bufferQueue, buffer, async (event) => hasStreamInterest(streams, event));

  // Per instance exclusive queue, still used for cross-tenant streams (live only).
  const liveEvents = await createAmqpEventService({
    AMQP_HOST: config.amqpHost,
    AMQP_USER: config.amqpUser,
    AMQP_PASSWORD: config.amqpPassword,
    logger,
  });

  const connections = new Set<Socket>();
  app.use('/stream', (req, res, next) => {
    connections.add(req.socket);
    res.on('close', () => connections.delete(req.socket));
    // Stand-in for the SDK configuration handler; there's no authentication so requests are anonymous.
    (req as unknown as { getConfiguration: () => Promise<unknown> }).getConfiguration = async () => streams;
    next();
  });

  const tenantService = {
    getTenantByName: async (name: string) =>
      name === config.tenantName ? { id: tenantId, name, realm: config.tenantName } : null,
  } as unknown as TenantService;

  app.use(
    '/stream/v1',
    createStreamRouter([], {
      logger,
      eventServiceAmp: liveEvents,
      eventServiceAmpWebhooks: { getItems: () => NEVER, isConnected: () => true, enqueue: async () => undefined },
      tenantService,
      tokenProvider: {} as TokenProvider,
      eventService: {} as EventService,
      configurationService: {} as ConfigurationService,
      serviceId: AdspId.parse('urn:ads:platform:push-service'),
      buffer,
      tailer,
      resumable: { keepAliveMs: 15000, replayPageSize: 200 },
    }),
  );

  // Demo controls.
  const publisher = await createPublisher();
  const streamKey = `push:events:{${config.tenantId}}`;
  const epochKey = `push:epoch:{${config.tenantId}}`;

  app.post('/dev/events', async (req, res, next) => {
    try {
      const { count = 1, name = 'item-updated', duplicate = false } = req.body || {};
      const ids: string[] = [];
      for (let i = 0; i < Math.min(count, 1000); i++) {
        const seq = name === 'item-updated' ? await redis.call('INCR', 'demo:seq') : null;
        const id = await publisher.publish({
          namespace: config.namespace,
          name,
          context: { itemId: `item-${(Number(seq) || 0) % 3}` },
          payload: { seq, publishedAt: new Date().toISOString() },
        });
        if (duplicate) {
          // Same event id published again, e.g. an AMQP redelivery; the buffer should store it once.
          await publisher.publish({ id, namespace: config.namespace, name, payload: { seq, duplicate: true } });
        }
        ids.push(id);
      }
      res.send({ published: ids });
    } catch (err) {
      next(err);
    }
  });

  app.post('/dev/drop', (_req, res) => {
    const count = connections.size;
    connections.forEach((socket) => socket.destroy());
    res.send({ dropped: count });
  });

  app.post('/dev/trim', async (_req, res, next) => {
    try {
      // Simulates events expiring out of retention before the client reconnects.
      const trimmed = await buffer.trimBefore(tenantId, new Date(Date.now() + 1));
      res.send({ trimmed });
    } catch (err) {
      next(err);
    }
  });

  app.post('/dev/wipe', async (_req, res, next) => {
    try {
      // Simulates Redis data loss; the epoch changes so clients are told to resync.
      const deleted = await redis.call('DEL', streamKey, epochKey, `push:trimmed:{${config.tenantId}}`);
      res.send({ deleted });
    } catch (err) {
      next(err);
    }
  });

  app.get('/dev/state', async (_req, res, next) => {
    try {
      res.send({
        length: await redis.call('XLEN', streamKey),
        head: await buffer.getHead(tenantId),
        epoch: await redis.call('GET', epochKey),
        seq: await redis.call('GET', 'demo:seq'),
        connections: connections.size,
        tailers: tailer.activeTenants,
      });
    } catch (err) {
      next(err);
    }
  });

  const demoScript = await bundleDemo();
  app.get('/demo.js', (_req, res) => res.type('application/javascript').send(demoScript));
  app.get('/', (_req, res) => res.sendFile(join(__dirname, 'demo', 'index.html')));

  server.listen(config.port, () => {
    logger.info(`Push harness listening at http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  logger.error(`Harness failed to start: ${err}`);
  process.exit(1);
});
