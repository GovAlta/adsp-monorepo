/**
 * Combine the tenant name and id into a single metric label value, e.g. `Wildfire 64d4eef5abc788a358dece8c`.
 *
 * Name and id are one-to-one, so carrying them as separate labels adds index weight without
 * distinguishing any additional series. The name leads because Grafana legends truncate from the
 * right; the bare id follows so the value still resolves to a specific tenant.
 *
 * The value must stay free of regex metacharacters. Grafana's `${var:regex}` formatter
 * backslash-escapes them and PromQL rejects the result -- `\(` and `\/` are not valid string
 * escapes -- so a value like `Wildfire (urn:ads:platform:tenant-service:v2:/tenants/64d4...)` makes
 * every panel that filters by tenant fail to parse. Hence the trailing path segment of the URN
 * rather than the whole URN, and no punctuation around it. The URN prefix is constant, so nothing
 * identifying is lost.
 *
 * A tenant *name* containing a metacharacter (there is a `roy.test` in dev) is still a hazard here,
 * because the name is passed through verbatim. Dashboards should interpolate with `${var:pipe}`
 * rather than `${var:regex}`: pipe does not escape, and a `.` in a name still matches itself.
 *
 * Spans keep adsp.tenant.id and adsp.tenant.name as separate attributes. Span attributes are not
 * aggregated, so they cost nothing there, and the full URN supports exact-match TraceQL filtering.
 */
export function formatTenantAttribute(tenantId?: string, tenantName?: string): string | undefined {
  const id = tenantId ? tenantId.split('/').pop() || undefined : undefined;

  if (id && tenantName) {
    return `${tenantName} ${id}`;
  }

  return tenantName || id || undefined;
}
