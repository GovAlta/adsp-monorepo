import { Router } from 'express';
import { Logger } from 'winston';
import { MetricsController } from '../controllers/metrics.controller';

// ✓ ASVS:V1.6.1 — metrics route is public; no auth middleware applied
// ✓ ASVS:V4.1.3 — route registered in central router via createMetricsRouter factory
// [IMPL-DEFERRED: SYSREQ-023] — stub Prometheus implementation; full prom-client deferred

export interface MetricsRouterOptions {
  logger: Logger;
}

/**
 * createMetricsRouter — mounts the GET /metrics Prometheus endpoint.
 *
 * Mounted at /metrics (no /api/v1 prefix) so Prometheus scrapers can reach
 * the endpoint at the canonical /metrics path.
 *
 * No authentication required — this is an infrastructure probe endpoint.
 * security: [] in OpenAPI spec.
 *
 * [IMPL-DEFERRED: SYSREQ-023] — stub implementation; returns zero-value counters.
 *   Full implementation installs prom-client and wires real request counters/histograms.
 */
export function createMetricsRouter(options: MetricsRouterOptions): Router {
  const { logger } = options;
  const router = Router();
  const controller = new MetricsController(logger);

  // ✓ ASVS:V1.6.1 — no requireAuth; metrics endpoint is intentionally public
  // GET /metrics — operationId: getMetrics
  // [IMPL-DEFERRED: SYSREQ-023] — stub prom-client; replace controller with real metrics registry
  router.get('/', controller.getMetrics);

  return router;
}
