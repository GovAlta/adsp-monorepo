import { Request } from 'express';
import { getRouteTemplate } from './route';

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
