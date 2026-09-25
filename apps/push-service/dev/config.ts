export const config = {
  port: parseInt(process.env.PORT || '3390'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6380',
  amqpHost: process.env.AMQP_HOST || 'localhost',
  amqpUser: process.env.AMQP_USER || 'guest',
  amqpPassword: process.env.AMQP_PASSWORD || 'guest',
  // Separate queue from a real push-service so the harness can share a broker without stealing its events.
  bufferQueue: process.env.PUSH_BUFFER_QUEUE || 'push-service-buffer-dev',
  retentionMs: parseInt(process.env.PUSH_BUFFER_RETENTION_MINUTES || '60') * 60 * 1000,
  tenantName: 'demo',
  tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/demo',
  streamId: 'demo-updates',
  namespace: 'demo-service',
};
