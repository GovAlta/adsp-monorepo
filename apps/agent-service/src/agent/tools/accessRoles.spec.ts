import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import type { ModelTextOutput } from './accessModelOutput';
import { createAccessRoleTools } from './accessRoles';
import {
  adminKey,
  CATALOG_URL,
  contextFor,
  createCaller,
  createTestDirectory,
  createTestLogger,
  DEV_HOST,
  devEnvironment,
  httpError,
  PROD_HOST,
  routeRequests,
  TENANT_URL,
  tenantRealm,
  tenantResponse,
} from '../../test/accessToolTestSupport';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    __esModule: true,
    default: { ...actual.default, get: jest.fn() },
    isAxiosError: actual.isAxiosError,
  };
});
const mockedGet = axios.get as jest.Mock;

const TENANT_SERVICE = 'urn:ads:platform:tenant-service';
const FORM_SERVICE = 'urn:ads:platform:form-service';
const OTHER_SERVICE = 'urn:ads:demo:other-service';

const catalogRoutes = {
  [`${CATALOG_URL}?core=true`]: {
    latest: {
      configuration: {
        [FORM_SERVICE]: {
          roles: [
            { role: 'form-admin', description: 'Administers forms.', inTenantAdmin: true },
            { role: 'form-applicant', description: 'Submits forms.' },
          ],
        },
        [TENANT_SERVICE]: { roles: [{ role: 'tenant-admin', description: 'Tenant administrator.' }] },
      },
    },
  },
  [CATALOG_URL]: { latest: { configuration: { [OTHER_SERVICE]: { roles: [{ role: 'admin' }] } } } },
};

const indexRoutes = {
  [adminKey('/roles', { briefRepresentation: true })]: [{ id: 'r-offline', name: 'offline_access', composite: false }],
  [adminKey('/clients', { first: 0, max: 500 })]: [
    { id: 'c-tenant', clientId: TENANT_SERVICE, secret: 'client-secret-value' },
    { id: 'c-form', clientId: FORM_SERVICE },
    { id: 'c-other', clientId: OTHER_SERVICE },
  ],
  [adminKey('/clients/c-tenant/roles', { briefRepresentation: true })]: [
    { id: 'r-admin', name: 'tenant-admin', composite: true },
  ],
  [adminKey('/clients/c-form/roles', { briefRepresentation: true })]: [
    { id: 'r-form-admin', name: 'form-admin', composite: false },
    { id: 'r-form-applicant', name: 'admin', composite: false },
  ],
  [adminKey('/clients/c-other/roles', { briefRepresentation: true })]: [{ id: 'r-other-admin', name: 'admin' }],
  [adminKey('/roles-by-id/r-admin/composites')]: [{ id: 'r-form-admin' }, { id: 'r-offline' }],
};

const baseRoutes = { [TENANT_URL]: tenantResponse, ...catalogRoutes, ...indexRoutes };
const page = (max: number) => ({ first: 0, max, briefRepresentation: true });

describe('createAccessRoleTools', () => {
  const logger = createTestLogger();
  const directory = createTestDirectory();
  const tools = createAccessRoleTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(DEV_HOST),
  });
  const productionTools = createAccessRoleTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(PROD_HOST),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockReset();
  });

  it('uses the tool names as the tool IDs', () => {
    expect(Object.values(tools).map((tool) => tool.id)).toEqual([
      'listAccessServiceRoles',
      'getAccessRole',
      'listAccessRoleMembers',
    ]);
  });

  describe('listAccessServiceRoles', () => {
    it('lists platform and tenant service roles', async () => {
      routeRequests(mockedGet, baseRoutes);

      const result = await tools.listAccessServiceRoles.execute({}, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'available',
        message: '4 roles across 3 services (read-only).',
        environment: devEnvironment,
        realm: tenantRealm,
      });
      expect(result.services.map((entry) => [entry.service, entry.source])).toEqual([
        [OTHER_SERVICE, 'tenant'],
        [FORM_SERVICE, 'platform'],
        [TENANT_SERVICE, 'platform'],
      ]);
    });

    it('narrows to a service named in plain words', async () => {
      routeRequests(mockedGet, baseRoutes);

      const result = await tools.listAccessServiceRoles.execute({ service: 'forms' }, contextFor(createCaller()));

      expect(result.services).toEqual([
        {
          service: FORM_SERVICE,
          source: 'platform',
          roles: [
            { role: 'form-admin', description: 'Administers forms.', inTenantAdmin: true },
            { role: 'form-applicant', description: 'Submits forms.', inTenantAdmin: false },
          ],
        },
      ]);
    });

    it('reports SERVICE_NOT_FOUND for a service that does not exist', async () => {
      routeRequests(mockedGet, baseRoutes);

      const result = await tools.listAccessServiceRoles.execute({ service: 'payments' }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'not-found',
        reason: 'SERVICE_NOT_FOUND',
        search: 'payments',
        services: [],
      });
    });

    it('reports when configuration cannot be read', async () => {
      routeRequests(mockedGet, {
        ...baseRoutes,
        [`${CATALOG_URL}?core=true`]: httpError(HttpStatusCodes.FORBIDDEN),
      });

      const result = await tools.listAccessServiceRoles.execute({}, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_ROLE_CATALOG_ACCESS', services: [] });
    });

    it('gives the model each role of the service with what it is for and whether tenant-admin includes it', async () => {
      routeRequests(mockedGet, baseRoutes);
      const result = await tools.listAccessServiceRoles.execute({ service: 'forms' }, contextFor(createCaller()));

      const { value } = tools.listAccessServiceRoles.toModelOutput(result) as ModelTextOutput;

      expect(value).toBe(
        [
          'status: available',
          'env: Development (dev, read-only); realm: Tenant One (realm-1, tenant, active)',
          'service searched for: "forms"',
          "tenant-admin default: the service adds the role to tenant-admin for new tenants; this realm's tenant-admin " +
            'can differ, so use getAccessRole to say whether tenant-admin includes a role now',
          `${FORM_SERVICE} (platform):`,
          '- form-admin (tenant-admin default): Administers forms.',
          '- form-applicant (not a tenant-admin default): Submits forms.',
        ].join('\n'),
      );
    });

    it('gives the model the reason and the service it searched for when no service matches', async () => {
      routeRequests(mockedGet, baseRoutes);
      const result = await tools.listAccessServiceRoles.execute({ service: 'payments' }, contextFor(createCaller()));

      const { value } = tools.listAccessServiceRoles.toModelOutput(result) as ModelTextOutput;

      expect(value).toMatch(/^status: not-found \(SERVICE_NOT_FOUND\): .+\n.+\nservice searched for: "payments"/);
    });
  });

  describe('getAccessRole', () => {
    it('explains a role: description, what includes it and whether tenant-admin includes it', async () => {
      routeRequests(mockedGet, {
        ...baseRoutes,
        [adminKey('/clients/c-form/roles/form-admin')]: { id: 'r-form-admin', name: 'form-admin', description: '' },
      });

      const result = await tools.getAccessRole.execute({ role: 'form-admin' }, contextFor(createCaller()));

      expect(result).toEqual({
        status: 'available',
        message: `Role form-admin on ${FORM_SERVICE} in realm Tenant One (realm-1) in Development (read-only).`,
        environment: devEnvironment,
        realm: tenantRealm,
        search: 'form-admin',
        role: {
          name: 'form-admin',
          client: FORM_SERVICE,
          description: 'Administers forms.',
          composite: false,
          inTenantAdmin: true,
          includes: [],
          includedIn: [
            { name: 'tenant-admin', client: TENANT_SERVICE, via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] },
          ],
        },
      });
      expect(JSON.stringify(result)).not.toContain('client-secret-value');
    });

    it('lists the roles a composite role includes', async () => {
      routeRequests(mockedGet, {
        ...baseRoutes,
        [adminKey('/clients/c-tenant/roles/tenant-admin')]: { name: 'tenant-admin', description: 'From Keycloak.' },
      });

      const result = await tools.getAccessRole.execute({ role: 'tenant-admin' }, contextFor(createCaller()));

      expect(result.role).toMatchObject({
        description: 'From Keycloak.',
        composite: true,
        includes: [{ name: 'form-admin', client: FORM_SERVICE }, { name: 'offline_access' }],
        includedIn: [],
      });
    });

    it('offers choices when several services have a role with that name', async () => {
      routeRequests(mockedGet, baseRoutes);

      const result = await tools.getAccessRole.execute({ role: 'admin' }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'not-found',
        reason: 'ROLE_AMBIGUOUS',
        suggestions: [`admin on ${FORM_SERVICE}`, `admin on ${OTHER_SERVICE}`],
      });
    });

    it('narrows to the named service', async () => {
      routeRequests(mockedGet, {
        ...baseRoutes,
        [adminKey('/clients/c-other/roles/admin')]: { name: 'admin' },
      });

      const result = await tools.getAccessRole.execute(
        { role: 'admin', service: 'other service' },
        contextFor(createCaller()),
      );

      expect(result.role).toMatchObject({ name: 'admin', client: OTHER_SERVICE });
    });

    it('suggests similar roles when none has that name', async () => {
      routeRequests(mockedGet, baseRoutes);

      const result = await tools.getAccessRole.execute({ role: 'form' }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'not-found',
        reason: 'ROLE_NOT_FOUND',
        suggestions: [`form-admin on ${FORM_SERVICE}`],
      });
    });

    it('explains roles in Production too, since roles are not people', async () => {
      routeRequests(mockedGet, {
        [TENANT_URL]: tenantResponse,
        ...catalogRoutes,
        ...Object.fromEntries(
          Object.entries({ ...indexRoutes, [adminKey('/clients/c-form/roles/form-admin')]: {} }).map(([key, value]) => [
            key.replace(DEV_HOST, PROD_HOST),
            value,
          ]),
        ),
      });

      const result = await productionTools.getAccessRole.execute(
        { role: 'form-admin' },
        contextFor(createCaller(PROD_HOST)),
      );

      expect(result.status).toBe('available');
    });

    it('gives the model the role, its description and the chain of each role that includes it', async () => {
      routeRequests(mockedGet, {
        ...baseRoutes,
        [adminKey('/clients/c-form/roles/form-admin')]: { id: 'r-form-admin', name: 'form-admin', description: '' },
      });
      const result = await tools.getAccessRole.execute({ role: 'form-admin' }, contextFor(createCaller()));

      const { value } = tools.getAccessRole.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        `role: form-admin (${FORM_SERVICE}), not composite, tenant-admin default — Administers forms.\n` +
          'includes: none\n' +
          `included in (outermost first): tenant-admin (${TENANT_SERVICE})`,
      );
    });

    it('gives the model the roles a composite role includes', async () => {
      routeRequests(mockedGet, {
        ...baseRoutes,
        [adminKey('/clients/c-tenant/roles/tenant-admin')]: { name: 'tenant-admin', description: 'From Keycloak.' },
      });
      const result = await tools.getAccessRole.execute({ role: 'tenant-admin' }, contextFor(createCaller()));

      const { value } = tools.getAccessRole.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(`includes: form-admin (${FORM_SERVICE}), offline_access`);
    });

    it('gives the model the choices when several services have a role with that name', async () => {
      routeRequests(mockedGet, baseRoutes);
      const result = await tools.getAccessRole.execute({ role: 'admin' }, contextFor(createCaller()));

      const { value } = tools.getAccessRole.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        `role searched for: "admin"\nsuggestions: admin on ${FORM_SERVICE}, admin on ${OTHER_SERVICE}`,
      );
    });
  });

  describe('listAccessRoleMembers', () => {
    const holderRoutes = {
      ...baseRoutes,
      [adminKey('/clients/c-form/roles/form-admin/users', page(101))]: [
        { id: 'u-1', username: 'zed', email: 'zed@example.com' },
      ],
      [adminKey('/clients/c-form/roles/form-admin/groups', page(26))]: [],
      [adminKey('/clients/c-tenant/roles/tenant-admin/users', page(101))]: [
        { id: 'u-2', username: 'amy', firstName: 'Amy' },
      ],
      [adminKey('/clients/c-tenant/roles/tenant-admin/groups', page(26))]: [],
    };

    it('lists who holds a role and how, with usernames only', async () => {
      routeRequests(mockedGet, holderRoutes);

      const result = await tools.listAccessRoleMembers.execute({ role: 'form-admin' }, contextFor(createCaller()));

      expect(result).toEqual({
        status: 'available',
        message: `2 accounts hold form-admin on ${FORM_SERVICE} in realm Tenant One (realm-1) in Development (read-only).`,
        environment: devEnvironment,
        realm: tenantRealm,
        search: 'form-admin',
        role: { name: 'form-admin', client: FORM_SERVICE },
        members: [
          { username: 'zed', serviceAccount: false, sources: [{ type: 'direct' }] },
          {
            username: 'amy',
            serviceAccount: false,
            sources: [{ type: 'composite', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] }],
          },
        ],
        counts: { direct: 1, group: 0, composite: 1 },
      });
      expect(JSON.stringify(result)).not.toMatch(/example\.com|Amy/);
    });

    it('does not list people in Production', async () => {
      const result = await productionTools.listAccessRoleMembers.execute(
        { role: 'form-admin' },
        contextFor(createCaller(PROD_HOST)),
      );

      expect(result).toMatchObject({ status: 'unavailable', reason: 'USER_INSPECTION_NOT_ALLOWED' });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('reports NO_USER_PERMISSION when Keycloak refuses to list holders', async () => {
      routeRequests(mockedGet, {
        ...baseRoutes,
        [adminKey('/clients/c-form/roles/form-admin/users', page(101))]: httpError(HttpStatusCodes.FORBIDDEN),
        [adminKey('/clients/c-form/roles/form-admin/groups', page(26))]: [],
      });

      const result = await tools.listAccessRoleMembers.execute({ role: 'form-admin' }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_USER_PERMISSION' });
      expect(result).not.toHaveProperty('members');
    });

    it('gives the model each holder with how they hold the role', async () => {
      routeRequests(mockedGet, holderRoutes);
      const result = await tools.listAccessRoleMembers.execute({ role: 'form-admin' }, contextFor(createCaller()));

      const { value } = tools.listAccessRoleMembers.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        `role: form-admin (${FORM_SERVICE})\n` +
          'held by: 1 direct, 0 through a group, 1 through a composite\n' +
          'members (2):\n' +
          '- zed ← direct\n' +
          `- amy ← via tenant-admin (${TENANT_SERVICE})`,
      );
    });

    it('never gives the model email addresses or names of holders', async () => {
      routeRequests(mockedGet, holderRoutes);
      const result = await tools.listAccessRoleMembers.execute({ role: 'form-admin' }, contextFor(createCaller()));

      const { value } = tools.listAccessRoleMembers.toModelOutput(result) as ModelTextOutput;

      expect(value).not.toMatch(/example\.com|Amy/);
    });
  });
});
