import type { User } from '@abgov/adsp-service-sdk';
import { jest } from '@jest/globals';
import { AxiosError } from 'axios';

/**
 * Test support for the Access tool specs: a caller in a tenant realm and a table of Keycloak and ADSP responses keyed
 * by URL and query string. Each spec mocks axios itself, since jest.mock is hoisted per file.
 */

export const DEV_HOST = 'https://access.adsp-dev.gov.ab.ca';
export const PROD_HOST = 'https://access.alberta.ca';
export const TENANT_URL = 'https://tenant-service.test/api/tenant/v2/tenants/tenant-1';
export const CONFIGURATION_URL = 'https://configuration-service.test/configuration/v2';
export const CATALOG_URL = `${CONFIGURATION_URL}/configuration/platform/tenant-service`;
export const AGENT_USER_ROLE = 'urn:ads:platform:agent-service:agent-user';

export const tenantResponse = { realm: 'realm-1', name: 'Tenant One', status: 'active', adminEmail: 'a@example.com' };
export const devEnvironment = { id: 'dev', label: 'Development', host: DEV_HOST, readOnly: true };
export const tenantRealm = { realm: 'realm-1', name: 'Tenant One', kind: 'tenant', status: 'active' };

const tenantId = { toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1' };

export function createTestDirectory() {
  return {
    getResourceUrl: jest.fn(async () => new URL(TENANT_URL)),
    getServiceUrl: jest.fn(async () => new URL(CONFIGURATION_URL)),
  };
}

export function createTestLogger() {
  return { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

export function createCaller(host = DEV_HOST): User {
  return {
    id: 'caller-1',
    name: 'Caller',
    email: 'caller@example.com',
    roles: [AGENT_USER_ROLE],
    tenantId,
    isCore: false,
    token: { iss: `${host}/auth/realms/realm-1`, bearer: 'caller-token' },
  } as unknown as User;
}

export function contextFor(user?: User) {
  const values = { user, tenantId };
  return { requestContext: { get: (key: string) => values[key] } } as never;
}

type Params = Record<string, string | number | boolean>;

function toQuery(params?: Params): string {
  return params ? `?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}` : '';
}

export function adminKey(path: string, params?: Params, host = DEV_HOST): string {
  return `${host}/auth/admin/realms/realm-1${path}${toQuery(params)}`;
}

export function httpError(status?: number): AxiosError {
  const error = new AxiosError('Request failed', status ? 'ERR_BAD_RESPONSE' : 'ECONNABORTED');
  if (status) {
    error.response = { status, data: {}, statusText: '', headers: {}, config: {} as never };
  }
  return error;
}

/**
 * Answers GET requests from a table keyed by URL and query string. Any other request fails the test.
 */
type GetHandler = (url: string, options?: { params?: Params }) => Promise<{ data: unknown }>;

export function routeRequests(
  mockedGet: { mockImplementation: (handler: GetHandler) => unknown },
  routes: Record<string, unknown>,
): void {
  mockedGet.mockImplementation(async (url, options) => {
    const key = `${url}${toQuery(options?.params)}`;
    if (!(key in routes)) {
      throw new Error(`Unexpected request ${key}`);
    }
    const response = routes[key];
    if (response instanceof Error) {
      throw response;
    }
    return { data: response };
  });
}
