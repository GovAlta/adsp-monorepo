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

const CAPTURED_ROUTE = Symbol('adspCapturedRoute');

/**
 * Capture the route label at the instant Express assigns req.route.
 *
 * req.baseUrl is only correct while the router that matched is still on the stack. Express restores
 * it as the stack unwinds, so anything that reads it later can see the wrong value:
 *
 *   success  -> response written inside the router      -> /form/v1/definitions/:definitionId
 *   error    -> response written by the app error handler -> /definitions/:definitionId
 *
 * Both variants were live in adsp-dev for the same endpoints, splitting one endpoint's traffic
 * across two series. Reading at `finish`, or even at writeHead, is too late -- the error handler
 * writes the headers itself, after the unwind. Assignment of req.route is the one moment the
 * mount path and the route template are both correct.
 */
export function captureRouteLabel(req: Request): void {
  let route = req.route;

  Object.defineProperty(req, 'route', {
    configurable: true,
    enumerable: true,
    get: () => route,
    set: (value) => {
      route = value;
      if (typeof value?.path === 'string') {
        req[CAPTURED_ROUTE] = `${req.baseUrl || ''}${value.path}`;
      }
    },
  });
}

/**
 * Route label for a completed request, preferring the value captured when the route was matched.
 *
 * Falls back to resolving it now, which covers requests that never matched a route at all.
 */
export function getCapturedRouteLabel(req: Request): string {
  return (req[CAPTURED_ROUTE] as string) ?? getRouteLabel(req);
}
