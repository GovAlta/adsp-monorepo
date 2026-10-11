import { Request, Response } from 'express';
import { Logger } from 'winston';
import { MetricsService } from '../services/metrics.service';

// ✓ ASVS:V1.6.1 — metrics endpoint exposes no Protected B data; only process counters
// ✓ ASVS:V7.1.1 — no sensitive data in metrics response; only numeric counters and version info
// [IMPL-DEFERRED: SYSREQ-023] — full Prometheus prom-client integration deferred to Stage 5
//   Stub returns Prometheus text format with basic counters (value 0).
// FAC-S4-COV-001 — MetricsService wired; controller delegates to service layer

/**
 * MetricsController — public Prometheus-compatible metrics endpoint.
 *
 * GET /metrics
 * operationId: getMetrics
 *
 * No authentication required (security: [] in OpenAPI spec).
 * Returns Prometheus text format (Content-Type: text/plain; version=0.0.4).
 *
 * Stub implementation: emits static HELP + TYPE comment headers and zero-value
 * counters. Full prom-client integration is deferred (SYSREQ-023).
 *
 * This is an infrastructure probe — no audit logging emitted (not a business operation).
 *
 * [IMPL-DEFERRED: SYSREQ-023] — install prom-client, register real counters/histograms,
 *   and replace buildMetricsText() with client.register.metrics() in the full implementation.
 */
export class MetricsController {
  // FAC-S4-COV-001 — MetricsService injected; metrics logic delegated to service layer
  private readonly metricsService: MetricsService;

  constructor(private readonly logger: Logger) {
    // ✓ ASVS:V1.6.1 — MetricsService produces only process-level counters; no Protected B data
    this.metricsService = new MetricsService();
  }

  /**
   * GET /metrics
   * operationId: getMetrics
   *
   * Returns Prometheus text exposition format (text/plain; version=0.0.4).
   *
   * ✓ ASVS:V1.6.1 — response contains only process counters; no Protected B content
   * ✓ ASVS:V7.1.1 — no credentials, URIs, or tenant data in metrics output
   * [IMPL-DEFERRED: SYSREQ-023] — stub counters with value 0; replace with prom-client
   * FAC-S4-COV-001 — delegates to MetricsService.getMetrics()
   */
  getMetrics = (_req: Request, res: Response): void => {
    // ✓ ASVS:V1.6.1 — only process-level metrics; no tenant or user data included
    // FAC-S4-COV-001 — metrics snapshot produced by service layer
    const snapshot = this.metricsService.getMetrics();

    // Prometheus scrape format requires Content-Type text/plain; version=0.0.4
    // ✓ ASVS:V7.1.1 — only metrics metadata in response; no sensitive data
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(snapshot.prometheusText);

    this.logger.debug('Metrics scraped', { uptimeSeconds: snapshot.uptimeSeconds });
  };
}
