import { Request } from 'express';
import { getRouteLabel, getRouteTemplate, UNMATCHED_ROUTE } from './route';

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
