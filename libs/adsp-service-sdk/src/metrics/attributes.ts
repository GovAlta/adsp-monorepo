/**
 * Combine the tenant name and URN into a single metric label value, e.g.
 * `Wildfire (urn:ads:platform:tenant-service:v2:/tenants/64d4eef5abc788a358dece8c)`.
 *
 * Name and URN are one-to-one, so carrying them as separate labels adds index weight without
 * distinguishing any additional series. The name leads because Grafana legends truncate from the
 * right, and the URN follows so the value remains a canonical identifier.
 *
 * Spans keep the two as separate attributes: span attributes are not aggregated, so there is no
 * cost to them, and keeping the URN on its own supports exact-match filtering in TraceQL.
 */
export function formatTenantAttribute(tenantId?: string, tenantName?: string): string | undefined {
  if (tenantId && tenantName) {
    return `${tenantName} (${tenantId})`;
  }

  return tenantName || tenantId || undefined;
}
