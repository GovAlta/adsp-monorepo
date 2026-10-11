import { Router } from 'express';
import { Logger } from 'winston';
import { HealthController } from '../controllers/health.controller';

// ✓ ASVS:V1.6.1 — health route is public; no auth middleware applied
// ✓ ASVS:V4.1.3 — route registered in central router via createHealthRouter factory

export interface HealthRouterOptions {
  logger: Logger;
}

/**
 * createHealthRouter — mounts the GET /health probe endpoint.
 *
 * Mounted at /health (no /api/v1 prefix) so ADSP platform health checks
 * can reach it at the canonical /health path.
 *
 * No authentication required — this is an infrastructure probe endpoint.
 * security: [] in OpenAPI spec.
 */
export function createHealthRouter(options: HealthRouterOptions): Router {
  const { logger } = options;
  const router = Router();
  const controller = new HealthController(logger);

  // ✓ ASVS:V1.6.1 — no requireAuth; health endpoint is intentionally public
  // GET /health — operationId: getHealth
  router.get('/', controller.getHealth);

  return router;
}
