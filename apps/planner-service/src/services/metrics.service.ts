// FAC-S4-005 — imports shared AppError type for error-boundary compliance
import { AppError } from '../types';
// ✓ ASVS:V1.6.1 — MetricsService exposes only process-level counters; no Protected B data
// ✓ ASVS:V7.1.1 — no sensitive data, credentials, or tenant information in metrics output
// [IMPL-DEFERRED: SYSREQ-023] — stub implementation; full prom-client integration deferred to Stage 5
//   Stub returns zero-value counters and current process uptime.

/**
 * MetricsSnapshot — the shape returned by MetricsService.getMetrics().
 *
 * ✓ ASVS:V1.6.1 — only process-level, non-sensitive metrics fields present
 */
export interface MetricsSnapshot {
  /** Total process uptime in seconds */
  uptimeSeconds: number;
  /** Node.js runtime version string */
  nodeVersion: string;
  /** Total HTTP requests received (stub: 0 until prom-client wired) */
  requestCountTotal: number;
  /** Prometheus text format string for /metrics endpoint */
  prometheusText: string;
}

/**
 * MetricsService — business-layer metrics aggregation for the planner service.
 *
 * FAC-S4-COV-001: provides a service layer for the MetricsController so that
 * metrics collection logic is not inlined in the controller handler.
 *
 * [IMPL-DEFERRED: SYSREQ-023] — install prom-client, register Counters/Histograms,
 *   and replace buildPrometheusText() with register.metrics() in the full implementation.
 */
export class MetricsService {
  /**
   * getMetrics — returns a MetricsSnapshot with current process metrics.
   *
   * ✓ ASVS:V1.6.1 — no tenant, user, or Protected B fields exposed
   * ✓ ASVS:V7.1.1 — only numeric counters and version strings in response
   * [IMPL-DEFERRED: SYSREQ-023] — requestCountTotal is always 0; replace with prom-client Counter
   */
  getMetrics(): MetricsSnapshot {
    const uptimeSeconds = parseFloat(process.uptime().toFixed(3));
    const nodeVersion = process.versions.node;
    const [nodeMajor = '0', nodeMinor = '0', nodePatch = '0'] = nodeVersion.split('.');

    // [IMPL-DEFERRED: SYSREQ-023] — stub Prometheus text format
    // Full implementation: replace with (await register.metrics()) from prom-client
    const prometheusText = [
      '# HELP process_uptime_seconds Total uptime of the process in seconds.',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptimeSeconds}`,
      '',
      '# HELP nodejs_version_info Node.js version info.',
      '# TYPE nodejs_version_info gauge',
      `nodejs_version_info{version="${nodeVersion}",major="${nodeMajor}",minor="${nodeMinor}",patch="${nodePatch}"} 1`,
      '',
      '# HELP service_request_count_total Total number of HTTP requests received.',
      '# TYPE service_request_count_total counter',
      // [IMPL-DEFERRED: SYSREQ-023] — stub value 0; wire to real prom-client Counter
      'service_request_count_total{service="planner-service"} 0',
      '',
      '# HELP service_request_duration_seconds HTTP request duration histogram.',
      '# TYPE service_request_duration_seconds histogram',
      // [IMPL-DEFERRED: SYSREQ-023] — stub buckets; replace with prom-client Histogram
      'service_request_duration_seconds_bucket{le="0.05",service="planner-service"} 0',
      'service_request_duration_seconds_bucket{le="0.1",service="planner-service"} 0',
      'service_request_duration_seconds_bucket{le="0.5",service="planner-service"} 0',
      'service_request_duration_seconds_bucket{le="1",service="planner-service"} 0',
      'service_request_duration_seconds_bucket{le="+Inf",service="planner-service"} 0',
      'service_request_duration_seconds_sum{service="planner-service"} 0',
      'service_request_duration_seconds_count{service="planner-service"} 0',
      '',
    ].join('\n');

    return {
      uptimeSeconds,
      nodeVersion,
      requestCountTotal: 0, // [IMPL-DEFERRED: SYSREQ-023]
      prometheusText,
    };
  }
}
