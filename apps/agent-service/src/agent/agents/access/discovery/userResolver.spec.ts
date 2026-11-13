import type { User } from '@abgov/adsp-service-sdk';
import type { ClientReader } from './clientReader';
import { createProblem } from './types';
import type { UserReader } from './userReader';
import { createUserResolver, toInfixSearch } from './userResolver';

const target = { host: 'https://access.adsp-dev.gov.ab.ca', realm: 'realm-1', user: {} as User };

function createReaders() {
  const userReader = {
    findUserId: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    searchUsers: jest.fn().mockResolvedValue({ ok: true, value: [] }),
  };
  const clientReader = {
    findClientInternalId: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    getServiceAccountUser: jest.fn(),
  };
  const resolver = createUserResolver(userReader as unknown as UserReader, clientReader as unknown as ClientReader);
  return { userReader, clientReader, resolver };
}

describe('toInfixSearch', () => {
  it('wraps each word so it matches anywhere in a name', () => {
    expect(toInfixSearch('  jane   doe ')).toBe('*jane* *doe*');
  });

  it('does not double up asterisks the person typed', () => {
    expect(toInfixSearch('*doe')).toBe('*doe*');
  });
});

describe('createUserResolver', () => {
  it('returns an exact username or email match and which field matched', async () => {
    const { userReader, resolver } = createReaders();
    userReader.findUserId.mockResolvedValueOnce({ ok: true, value: { id: 'id-1', field: 'email' } });

    expect(await resolver.resolveUser(target, 'jane@example.com')).toEqual({
      ok: true,
      value: { kind: 'found', userId: 'id-1', matchedBy: 'email' },
    });
    expect(userReader.searchUsers).not.toHaveBeenCalled();
  });

  it("finds an app's service account by its client ID", async () => {
    const { clientReader, resolver } = createReaders();
    clientReader.findClientInternalId.mockResolvedValueOnce({ ok: true, value: 'client-uuid' });
    clientReader.getServiceAccountUser.mockResolvedValueOnce({ ok: true, value: { id: 'sa-1' } });

    expect(await resolver.resolveUser(target, 'urn:ads:demo:api')).toEqual({
      ok: true,
      value: { kind: 'found', userId: 'sa-1', matchedBy: 'service-account' },
    });
    expect(clientReader.getServiceAccountUser).toHaveBeenCalledWith(target, 'client-uuid');
  });

  it('does not look for a client when the text has spaces, since it can only be a name', async () => {
    const { clientReader, userReader, resolver } = createReaders();
    userReader.searchUsers.mockResolvedValueOnce({ ok: true, value: [{ id: 'id-2', username: 'jdoe' }] });

    expect(await resolver.resolveUser(target, 'Jane Doe')).toEqual({
      ok: true,
      value: { kind: 'found', userId: 'id-2', matchedBy: 'search' },
    });
    expect(clientReader.findClientInternalId).not.toHaveBeenCalled();
  });

  it('falls back to a name search when the client has no service account', async () => {
    const { clientReader, userReader, resolver } = createReaders();
    clientReader.findClientInternalId.mockResolvedValueOnce({ ok: true, value: 'client-uuid' });
    clientReader.getServiceAccountUser.mockResolvedValueOnce({
      ok: false,
      problem: createProblem('not-found', 'CLIENT_NOT_FOUND'),
    });
    userReader.searchUsers.mockResolvedValueOnce({ ok: true, value: [{ id: 'id-3', username: 'web-app-tester' }] });

    expect(await resolver.resolveUser(target, 'web-app')).toMatchObject({
      ok: true,
      value: { kind: 'found', userId: 'id-3', matchedBy: 'search' },
    });
  });

  it('searches anywhere in names when nothing starts with the text', async () => {
    const { userReader, resolver } = createReaders();
    userReader.searchUsers
      .mockResolvedValueOnce({ ok: true, value: [] })
      .mockResolvedValueOnce({ ok: true, value: [{ id: 'id-4', username: 'jane.doe' }] });

    await resolver.resolveUser(target, 'doe');

    expect(userReader.searchUsers.mock.calls.map((call) => call[1])).toEqual(['doe', '*doe*']);
  });

  it('returns up to five usernames when several people match, never their emails or names', async () => {
    const { userReader, resolver } = createReaders();
    const people = Array.from({ length: 6 }, (_, index) => ({
      id: `id-${index}`,
      username: `jdoe${index}`,
      email: `jdoe${index}@example.com`,
      firstName: 'Jane',
    }));
    userReader.searchUsers.mockResolvedValueOnce({ ok: true, value: people });

    expect(await resolver.resolveUser(target, 'Jane')).toEqual({
      ok: true,
      value: { kind: 'ambiguous', suggestions: ['jdoe0', 'jdoe1', 'jdoe2', 'jdoe3', 'jdoe4'] },
    });
  });

  it('reports not found when nothing matches', async () => {
    const { resolver } = createReaders();

    expect(await resolver.resolveUser(target, 'nobody')).toEqual({ ok: true, value: { kind: 'not-found' } });
  });

  it('returns the problem when users cannot be read', async () => {
    const { userReader, resolver } = createReaders();
    const problem = createProblem('unavailable', 'NO_USER_PERMISSION');
    userReader.findUserId.mockResolvedValueOnce({ ok: false, problem });

    expect(await resolver.resolveUser(target, 'jdoe')).toEqual({ ok: false, problem });
  });
});
