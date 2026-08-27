import type { Request } from 'express';

/**
 * Resolve the Express route template matched by a request, e.g. `/form/v1/forms/:id`.
 *
 * Returns undefined until Express has matched a route, so callers must resolve this when the
 * response completes rather than from upstream middleware. Route templates are bounded by the
 * number of endpoints a service exposes, whereas raw paths embed resource IDs; using the template
 * is what keeps span names and metric labels from growing without limit.
 */
export function getRouteTemplate(req: Request): string | undefined {
  return typeof req.route?.path === 'string' ? `${req.baseUrl || ''}${req.route.path}` : undefined;
}

/**
 * Label value for requests that never matched a route. Falling through to req.path would put the
 * raw URL in the http_route label, and unmatched traffic is mostly internet scanners probing paths
 * like /.env, /.aws/credentials and /+CSCOE+/logon.html -- so the label would grow with hostile
 * traffic rather than with the service's own surface. Measured in adsp-dev before this change: 377
 * distinct http_route values, of which only 38 were real route templates and 87 were scanner probes.
 */
export const UNMATCHED_ROUTE = '<unmatched>';

/**
 * Resolve the bounded `http.route` label value for a request.
 *
 * A router mount path is kept when there is one, because mount paths are bounded by the number of
 * routers and still identify which API was hit.
 */
export function getRouteLabel(req: Request): string {
  // `||` not `??`: Express sets baseUrl to '' when no router matched, which ?? would pass through.
  return getRouteTemplate(req) ?? (req.baseUrl || UNMATCHED_ROUTE);
}
