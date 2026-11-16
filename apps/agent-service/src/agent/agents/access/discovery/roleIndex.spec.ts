import type { User } from '@abgov/adsp-service-sdk';
import type { ClientReader } from './clientReader';
import { createRoleIndexBuilder, findIncludingRoles, findRolesByName, RoleIndex } from './roleIndex';
import type { RoleReader } from './roleReader';
import { createProblem } from './types';
import type { UserReader } from './userReader';

const target = { host: 'https://access.adsp-dev.gov.ab.ca', realm: 'realm-1', user: {} as User };
const TENANT_SERVICE = 'urn:ads:platform:tenant-service';
const FORM_SERVICE = 'urn:ads:platform:form-service';

function createReaders() {
  const clientReader = {
    listAllClients: jest.fn().mockResolvedValue({
      ok: true,
      value: [
        { id: 'c-tenant', clientId: TENANT_SERVICE, secret: 'never-read' },
        { id: 'c-form', clientId: FORM_SERVICE },
      ],
    }),
  };
  const roleReader = {
    listRealmRoles: jest.fn().mockResolvedValue({
      ok: true,
      value: [
        { id: 'r-default', name: 'default-roles-realm-1', composite: true },
        { id: 'r-offline', name: 'offline_access', composite: false },
      ],
    }),
    listClientRoles: jest.fn(
      async (_target, clientUuid: string): Promise<unknown> => ({
        ok: true,
        value:
          clientUuid === 'c-tenant'
            ? [{ id: 'r-admin', name: 'tenant-admin', composite: true }]
            : [
                { id: 'r-form-admin', name: 'form-admin', composite: false },
                { id: 'r-form-applicant', name: 'Form-Applicant', composite: false },
              ],
      }),
    ),
  };
  const userReader = {
    getRoleComposites: jest.fn(
      async (_target, roleId: string): Promise<unknown> => ({
        ok: true,
        value: roleId === 'r-admin' ? [{ id: 'r-form-admin' }, { id: 'r-default' }] : [{ id: 'r-offline' }],
      }),
    ),
  };
  const builder = createRoleIndexBuilder({
    clientReader: clientReader as unknown as ClientReader,
    roleReader: roleReader as unknown as RoleReader,
    userReader: userReader as unknown as UserReader,
  });
  return { clientReader, roleReader, userReader, builder };
}

async function buildIndex(): Promise<RoleIndex> {
  const result = await createReaders().builder.buildRoleIndex(target);
  if (result.ok === false) {
    throw new Error('index failed');
  }
  return result.value;
}

describe('createRoleIndexBuilder', () => {
  it('indexes realm and client roles and which composites include which', async () => {
    const index = await buildIndex();

    expect([...index.roles.values()]).toEqual([
      { id: 'r-default', name: 'default-roles-realm-1', composite: true },
      { id: 'r-offline', name: 'offline_access', composite: false },
      { id: 'r-admin', name: 'tenant-admin', client: TENANT_SERVICE, clientUuid: 'c-tenant', composite: true },
      { id: 'r-form-admin', name: 'form-admin', client: FORM_SERVICE, clientUuid: 'c-form', composite: false },
      { id: 'r-form-applicant', name: 'Form-Applicant', client: FORM_SERVICE, clientUuid: 'c-form', composite: false },
    ]);
    expect(index.children.get('r-admin')).toEqual(['r-form-admin', 'r-default']);
    expect(index.parents.get('r-offline')).toEqual(['r-default']);
    expect(index.parents.get('r-default')).toEqual(['r-admin']);
    expect(index.incomplete).toBe(false);
  });

  it('marks the index incomplete when a client or composite cannot be read', async () => {
    const { roleReader, userReader, builder } = createReaders();
    const problem = createProblem('unavailable', 'NO_PERMISSION');
    roleReader.listClientRoles.mockResolvedValueOnce({ ok: false, problem });
    userReader.getRoleComposites.mockResolvedValueOnce({ ok: false, problem });

    const result = await builder.buildRoleIndex(target);

    expect(result.ok === true && result.value.incomplete).toBe(true);
  });

  it('returns the problem when realm roles cannot be read', async () => {
    const { roleReader, builder } = createReaders();
    const problem = createProblem('unavailable', 'NO_PERMISSION');
    roleReader.listRealmRoles.mockResolvedValueOnce({ ok: false, problem });

    expect(await builder.buildRoleIndex(target)).toEqual({ ok: false, problem });
  });
});

describe('findRolesByName', () => {
  it('matches names ignoring case', async () => {
    const index = await buildIndex();

    expect(findRolesByName(index, 'form-applicant').map((role) => role.id)).toEqual(['r-form-applicant']);
  });

  it('narrows to a client when one is given', async () => {
    const index = await buildIndex();

    expect(findRolesByName(index, 'form-admin', TENANT_SERVICE)).toEqual([]);
    expect(findRolesByName(index, 'form-admin', FORM_SERVICE).map((role) => role.id)).toEqual(['r-form-admin']);
  });

  it('reads "<client ID>:<role>" as a client role', async () => {
    const index = await buildIndex();

    expect(findRolesByName(index, `${FORM_SERVICE}:form-admin`).map((role) => role.id)).toEqual(['r-form-admin']);
  });
});

describe('findIncludingRoles', () => {
  it('lists every composite that includes the role, each with its shortest chain', async () => {
    const index = await buildIndex();

    expect(findIncludingRoles(index, 'r-offline')).toEqual([
      { role: expect.objectContaining({ id: 'r-default' }), via: [{ name: 'default-roles-realm-1' }] },
      {
        role: expect.objectContaining({ id: 'r-admin' }),
        via: [{ name: 'tenant-admin', client: TENANT_SERVICE }, { name: 'default-roles-realm-1' }],
      },
    ]);
  });

  it('returns nothing for a role no composite includes', async () => {
    expect(findIncludingRoles(await buildIndex(), 'r-admin')).toEqual([]);
  });
});
