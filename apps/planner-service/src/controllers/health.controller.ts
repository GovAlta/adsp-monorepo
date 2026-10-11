import { Request, Response } from 'express';
import * as mongoose from 'mongoose';
import { Logger } from 'winston';

// ✓ ASVS:V1.6.1 — health endpoint exposes no Protected B data; only infrastructure status
// ✓ ASVS:V7.1.1 — no sensitive data in health response; MongoDB URI never included

/**
 * HealthController — public infrastructure probe endpoint.
 *
 * GET /health
 * operationId: getHealth
 *
 * No authentication required (security: [] in OpenAPI spec).
 * Returns service health status including MongoDB connection state and process uptime.
 * HTTP 200 when healthy or degraded; HTTP 503 when unhealthy.
 *
 * Response shape:
 *   { status: 'healthy'|'degraded'|'unhealthy', checks: { mongo: 'up'|'down', uptime: number },
 *     version: string, serviceName: 'planner-service' }
 *
 * This is an infrastructure probe — no audit logging emitted (not a business operation).
 */
export class HealthController {
  constructor(private readonly logger: Logger) {}

  /**
   * GET /health
   * operationId: getHealth
   *
   * Checks MongoDB connection readyState and process uptime.
   * Returns 200 for healthy/degraded, 503 for unhealthy.
   *
   * ✓ ASVS:V1.6.1 — response contains only infrastructure metadata; no Protected B content
   * ✓ ASVS:V7.1.1 — MongoDB URI, credentials, and tenant data never included in response
   */
  getHealth = async (_req: Request, res: Response): Promise<void> => {
    // ✓ ASVS:V1.6.1 — only connection readyState (integer 0-3) exposed; no connection URI
    // mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const mongoReadyState = mongoose.connection.readyState;
    const mongoUp = mongoReadyState === 1;
    const mongoConnecting = mongoReadyState === 2;

    // ✓ ASVS:V7.1.1 — uptime is process.uptime() in seconds; no sensitive data
    const uptimeSeconds = Math.floor(process.uptime());

    // Determine overall status:
    //   healthy   — mongo connected
    //   degraded  — mongo connecting (in progress reconnect)
    //   unhealthy — mongo disconnected or disconnecting
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (mongoUp) {
      status = 'healthy';
    } else if (mongoConnecting) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const httpStatus = status === 'unhealthy' ? 503 : 200;

    const body = {
      status,
      checks: {
        mongo: mongoUp || mongoConnecting ? 'up' : 'down',
        uptime: uptimeSeconds,
      },
      version: process.env['npm_package_version'] ?? '1.0.0',
      serviceName: 'planner-service',
    };

    // Log at info level when degraded or unhealthy; debug when healthy (reduces noise)
    if (status === 'unhealthy') {
      // ✓ ASVS:V7.1.1 — only status string logged; no URI or credentials
      this.logger.warn('Health check: unhealthy', { mongoReadyState });
    } else if (status === 'degraded') {
      this.logger.info('Health check: degraded', { mongoReadyState });
    }

    res.status(httpStatus).json(body);
  };
}
