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
