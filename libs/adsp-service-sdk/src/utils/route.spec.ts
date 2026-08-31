import { Request } from 'express';
import { captureRouteLabel, getCapturedRouteLabel, getRouteLabel, getRouteTemplate, UNMATCHED_ROUTE } from './route';

describe('getRouteTemplate', () => {
  it('can resolve a mounted route template', () => {
    const req = { baseUrl: '/form/v1', route: { path: '/forms/:id' } };

    expect(getRouteTemplate(req as unknown as Request)).toBe('/form/v1/forms/:id');
  });

  it('can resolve a route template without a mount path', () => {
    const req = { baseUrl: '', route: { path: '/forms' } };

    expect(getRouteTemplate(req as unknown as Request)).toBe('/forms');
  });

  it('can resolve a route template with no baseUrl set', () => {
    const req = { route: { path: '/forms' } };

    expect(getRouteTemplate(req as unknown as Request)).toBe('/forms');
  });

  it('can return undefined for a request that has not matched a route', () => {
    const req = { baseUrl: '/form/v1', path: '/forms/a6bf5c59-b56c-45a5-839d-6e38ac926748' };

    expect(getRouteTemplate(req as unknown as Request)).toBeUndefined();
  });

  it('can return undefined for a non-string route path', () => {
    const req = { baseUrl: '/form/v1', route: { path: /^\/forms$/ } };

    expect(getRouteTemplate(req as unknown as Request)).toBeUndefined();
  });
});

describe('getRouteLabel', () => {
  it('can use the matched route template', () => {
    const req = { baseUrl: '/form/v1', route: { path: '/forms/:id' }, path: '/forms/abc' };

    expect(getRouteLabel(req as unknown as Request)).toBe('/form/v1/forms/:id');
  });

  it('can fall back to the router mount path when no route matched', () => {
    const req = { baseUrl: '/form/v1', path: '/does-not-exist' };

    expect(getRouteLabel(req as unknown as Request)).toBe('/form/v1');
  });

  it('can label an unmatched request without leaking its path', () => {
    // Scanner traffic: no router matched, so Express leaves baseUrl as an empty string.
    const req = { baseUrl: '', path: '/.aws/credentials', originalUrl: '/.aws/credentials' };

    expect(getRouteLabel(req as unknown as Request)).toBe(UNMATCHED_ROUTE);
  });

  it('can label an unmatched request when baseUrl is absent entirely', () => {
    const req = { path: '/.env' };

    expect(getRouteLabel(req as unknown as Request)).toBe(UNMATCHED_ROUTE);
  });
});

describe('captureRouteLabel', () => {
  it('can capture the mount prefix at the moment the route is matched', () => {
    const req = { baseUrl: '/form/v1' } as never;

    captureRouteLabel(req);
    (req as { route?: unknown }).route = { path: '/definitions/:definitionId' };
    // Express restores baseUrl when the router stack unwinds, e.g. into an app error handler.
    (req as { baseUrl: string }).baseUrl = '';

    expect(getCapturedRouteLabel(req)).toBe('/form/v1/definitions/:definitionId');
  });

  it('can keep req.route readable after capture', () => {
    const req = { baseUrl: '/form/v1' } as never;

    captureRouteLabel(req);
    (req as { route?: unknown }).route = { path: '/forms' };

    expect((req as { route?: { path: string } }).route?.path).toBe('/forms');
  });

  it('can take the innermost mount for a nested router', () => {
    const req = { baseUrl: '/form/v1' } as never;

    captureRouteLabel(req);
    (req as { baseUrl: string }).baseUrl = '/form/v1/nested';
    (req as { route?: unknown }).route = { path: '/deep/:id' };

    expect(getCapturedRouteLabel(req)).toBe('/form/v1/nested/deep/:id');
  });

  it('can fall back for a request that never matched a route', () => {
    const req = { baseUrl: '', path: '/.env' } as never;

    captureRouteLabel(req);

    expect(getCapturedRouteLabel(req)).toBe(UNMATCHED_ROUTE);
  });

  it('can ignore a non-string route path', () => {
    const req = { baseUrl: '/form/v1' } as never;

    captureRouteLabel(req);
    (req as { route?: unknown }).route = { path: /^\/forms$/ };

    expect(getCapturedRouteLabel(req)).toBe('/form/v1');
  });
});
