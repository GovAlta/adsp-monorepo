import {
  ATTRIBUTES,
  parseTimestamp,
  ROTATION_EXECUTOR,
  ROTATION_POLICY,
  ROTATION_PROFILE,
  RotationKeycloakClient,
  toState,
} from './keycloak';

describe('keycloak helpers', () => {
  it('parses epoch seconds and ISO strings', () => {
    expect(parseTimestamp('1780000000')).toEqual(new Date(1780000000 * 1000));
    expect(parseTimestamp('2026-06-01T00:00:00.000Z')).toEqual(new Date('2026-06-01T00:00:00Z'));
    expect(parseTimestamp(undefined)).toBeUndefined();
    expect(parseTimestamp('nonsense')).toBeUndefined();
  });

  it('maps attributes to state', () => {
    const state = toState({
      [ATTRIBUTES.expiry]: '1780000000',
      [ATTRIBUTES.noticeSentFor]: '2026-06-01T00:00:00.000Z',
    });
    expect(state.expiry).toEqual(new Date(1780000000 * 1000));
    expect(state.noticeSentFor).toEqual(new Date('2026-06-01T00:00:00Z'));
    expect(state.lastRotated).toBeUndefined();
  });
});

describe('RotationKeycloakClient', () => {
  const realm = 'tenant-realm';
  const kc = {
    realms: { find: jest.fn() },
    clientPolicies: {
      listProfiles: jest.fn(),
      listPolicies: jest.fn(),
      createProfiles: jest.fn(),
      updatePolicy: jest.fn(),
    },
    clients: {
      find: jest.fn(),
      findRole: jest.fn(),
      createRole: jest.fn(),
      delRole: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      generateNewClientSecret: jest.fn(),
      invalidateSecret: jest.fn(),
      findUsersWithRole: jest.fn(),
    },
    users: { find: jest.fn() },
  };
  const client = new RotationKeycloakClient(kc as never);

  beforeEach(() => jest.resetAllMocks());

  it('lists realms except master', async () => {
    kc.realms.find.mockResolvedValueOnce([{ realm: 'master' }, { realm: 'a' }]);
    expect(await client.listRealms()).toEqual(['a']);
  });

  describe('ensurePolicy', () => {
    it('creates the profile and policy, keeping others', async () => {
      kc.clientPolicies.listProfiles.mockResolvedValueOnce({ profiles: [{ name: 'other' }] });
      kc.clientPolicies.listPolicies.mockResolvedValueOnce({ policies: [{ name: 'other-policy' }] });

      expect(await client.ensurePolicy(realm, 90 * 86400, 7 * 86400)).toBe(true);

      const { profiles } = kc.clientPolicies.createProfiles.mock.calls[0][0];
      expect(profiles).toHaveLength(2);
      expect(profiles[1].executors[0].configuration).toEqual({
        'expiration-period': String(90 * 86400),
        'rotated-expiration-period': String(7 * 86400),
        'remaining-rotation-period': String(90 * 86400),
      });
      const { policies } = kc.clientPolicies.updatePolicy.mock.calls[0][0];
      expect(policies).toHaveLength(2);
      expect(policies[1].conditions.map((c: { condition: string }) => c.condition)).toEqual([
        'client-access-type',
        'client-roles',
      ]);
    });

    it('does nothing when already up to date', async () => {
      kc.clientPolicies.listProfiles.mockResolvedValueOnce({ profiles: [] });
      kc.clientPolicies.listPolicies.mockResolvedValueOnce({ policies: [] });
      await client.ensurePolicy(realm, 90 * 86400, 7 * 86400);
      const profile = kc.clientPolicies.createProfiles.mock.calls[0][0].profiles[0];
      const policy = kc.clientPolicies.updatePolicy.mock.calls[0][0].policies[0];
      jest.resetAllMocks();
      kc.clientPolicies.listProfiles.mockResolvedValueOnce({ profiles: [profile] });
      kc.clientPolicies.listPolicies.mockResolvedValueOnce({ policies: [policy] });

      expect(await client.ensurePolicy(realm, 90 * 86400, 7 * 86400)).toBe(false);
      expect(kc.clientPolicies.createProfiles).not.toHaveBeenCalled();
      expect(kc.clientPolicies.updatePolicy).not.toHaveBeenCalled();
    });

    it('only disables an enabled policy when off', async () => {
      kc.clientPolicies.listPolicies.mockResolvedValueOnce({ policies: [{ name: ROTATION_POLICY, enabled: true }] });

      expect(await client.ensurePolicy(realm, 90 * 86400, 7 * 86400, 'off')).toBe(true);

      expect(kc.clientPolicies.updatePolicy.mock.calls[0][0].policies).toEqual([
        { name: ROTATION_POLICY, enabled: false },
      ]);
      expect(kc.clientPolicies.createProfiles).not.toHaveBeenCalled();
    });

    it('does nothing when off and there is no enabled policy', async () => {
      kc.clientPolicies.listPolicies.mockResolvedValueOnce({ policies: [] });

      expect(await client.ensurePolicy(realm, 90 * 86400, 7 * 86400, 'off')).toBe(false);
      expect(kc.clientPolicies.updatePolicy).not.toHaveBeenCalled();
    });

    it('treats only an existing, switched-off policy as disabled', async () => {
      kc.clientPolicies.listPolicies
        .mockResolvedValueOnce({ policies: [{ name: ROTATION_POLICY, enabled: false }] })
        .mockResolvedValueOnce({ policies: [{ name: ROTATION_POLICY, enabled: true }] })
        .mockResolvedValueOnce({ policies: [] });

      expect(await client.isPolicyDisabled(realm)).toBe(true);
      expect(await client.isPolicyDisabled(realm)).toBe(false);
      expect(await client.isPolicyDisabled(realm)).toBe(false);
    });

    it('reads the mode from the policy: off when missing or disabled, otherwise selected', async () => {
      kc.clientPolicies.listPolicies
        .mockResolvedValueOnce({ policies: [] })
        .mockResolvedValueOnce({ policies: [{ name: ROTATION_POLICY, enabled: false }] })
        .mockResolvedValueOnce({
          policies: [{ name: ROTATION_POLICY, enabled: true, conditions: [{ condition: 'client-roles' }] }],
        });

      expect(await client.getPolicyMode(realm)).toBe('off');
      expect(await client.getPolicyMode(realm)).toBe('off');
      expect(await client.getPolicyMode(realm)).toBe('selected');
    });

    it('reads the expiration and rotated expiration in seconds from the profile executor', async () => {
      const executor = (configuration: Record<string, string>) => ({
        profiles: [{ name: ROTATION_PROFILE, executors: [{ executor: ROTATION_EXECUTOR, configuration }] }],
      });
      kc.clientPolicies.listProfiles
        .mockResolvedValueOnce({ profiles: [] })
        .mockResolvedValueOnce(executor({ 'expiration-period': '7776000', 'rotated-expiration-period': '432000' }))
        .mockResolvedValueOnce(executor({ 'expiration-period': '300' }));

      expect(await client.getPolicySchedule(realm)).toBeUndefined();
      expect(await client.getPolicySchedule(realm)).toEqual({
        expirationPeriod: 7776000,
        rotatedExpirationPeriod: 432000,
      });
      expect(await client.getPolicySchedule(realm)).toBeUndefined();
    });

    it('uses the expected names', () => {
      expect(ROTATION_PROFILE).toBe('secret-rotation-profile');
      expect(ROTATION_POLICY).toBe('secret-rotation');
    });
  });

  describe('listClients', () => {
    it('skips public, bearer-only and named clients and flags opt-in', async () => {
      kc.clients.find.mockResolvedValueOnce([
        { id: '1', clientId: 'pub', publicClient: true },
        { id: '2', clientId: 'bearer', bearerOnly: true },
        { id: '3', clientId: 'self' },
        { id: '4', clientId: 'in', attributes: { 'rotation-contact': 'a@x.ca, b@x.ca' } },
        { id: '5', clientId: 'out' },
      ]);
      kc.clients.findRole.mockResolvedValueOnce({ name: 'rotation-enabled' }).mockResolvedValueOnce(null);

      const result = await client.listClients(realm, ['self']);

      expect(result.map((c) => [c.clientId, c.optedIn])).toEqual([
        ['in', true],
        ['out', false],
      ]);
      expect(result[0].contacts).toEqual(['a@x.ca', 'b@x.ca']);
    });
  });

  describe('setOptIn', () => {
    beforeEach(() => kc.clients.find.mockResolvedValueOnce([{ id: '1', clientId: 'c' }]));

    it('creates the role on opt-in', async () => {
      kc.clients.findRole.mockResolvedValueOnce(null);
      await client.setOptIn(realm, 'c', true);
      expect(kc.clients.createRole).toHaveBeenCalledWith({ realm, id: '1', name: 'rotation-enabled' });
    });

    it('is a no-op when already opted in', async () => {
      kc.clients.findRole.mockResolvedValueOnce({ name: 'rotation-enabled' });
      await client.setOptIn(realm, 'c', true);
      expect(kc.clients.createRole).not.toHaveBeenCalled();
    });

    it('deletes the role on opt-out', async () => {
      kc.clients.findRole.mockResolvedValueOnce({ name: 'rotation-enabled' });
      await client.setOptIn(realm, 'c', false);
      expect(kc.clients.delRole).toHaveBeenCalledWith({ realm, id: '1', roleName: 'rotation-enabled' });
    });
  });

  it('sets and deletes attributes while keeping others', async () => {
    kc.clients.findOne.mockResolvedValueOnce({ id: '1', attributes: { keep: 'k', drop: 'd' } });
    await client.setAttributes(realm, '1', { drop: null, added: 'x' });
    expect(kc.clients.update).toHaveBeenCalledWith(
      { realm, id: '1' },
      { id: '1', attributes: { keep: 'k', added: 'x' } },
    );
  });

  it('discards the regenerated secret', async () => {
    kc.clients.generateNewClientSecret.mockResolvedValueOnce({ value: 'secret' });
    expect(await client.regenerateSecret(realm, '1')).toBeUndefined();
  });

  it('deletes only the previous secret', async () => {
    await client.invalidatePreviousSecret(realm, '1');
    expect(kc.clients.invalidateSecret).toHaveBeenCalledWith({ realm, id: '1' });
  });

  describe('listRealmAdmins', () => {
    it('lists enabled tenant admins with an email and their names', async () => {
      kc.clients.find.mockResolvedValueOnce([{ id: 'ts' }]);
      kc.clients.findUsersWithRole.mockResolvedValueOnce([
        { id: 'u1', firstName: 'Jo', lastName: 'Smith', email: 'jo@x.ca' },
        { id: 'u2', email: 'off@x.ca', enabled: false },
      ]);

      expect(await client.listRealmAdmins(realm)).toEqual([{ id: 'u1', name: 'Jo Smith', email: 'jo@x.ca' }]);
    });
  });

  describe('searchUsers', () => {
    it('returns enabled users that have an email', async () => {
      kc.users.find.mockResolvedValueOnce([
        { id: 'u1', username: 'jo', firstName: 'Jo', email: 'jo@x.ca' },
        { id: 'u2', username: 'nomail' },
        { id: 'u3', username: 'off', email: 'off@x.ca', enabled: false },
      ]);

      expect(await client.searchUsers(realm, 'jo', 5)).toEqual([
        { id: 'u1', username: 'jo', name: 'Jo', email: 'jo@x.ca' },
      ]);
      expect(kc.users.find).toHaveBeenCalledWith(expect.objectContaining({ realm, search: 'jo', max: 5 }));
    });
  });

  describe('countRealmAdminContacts', () => {
    it('counts enabled tenant admins that have an email', async () => {
      kc.clients.find.mockResolvedValueOnce([{ id: 'ts' }]);
      kc.clients.findUsersWithRole.mockResolvedValueOnce([
        { email: 'a@x.ca' },
        { email: 'b@x.ca', enabled: false },
        { username: 'no-email' },
      ]);

      expect(await client.countRealmAdminContacts(realm)).toBe(1);
      expect(kc.clients.findUsersWithRole).toHaveBeenCalledWith(
        expect.objectContaining({ realm, id: 'ts', roleName: 'tenant-admin' }),
      );
    });

    it('is zero when the realm has no tenant service client', async () => {
      kc.clients.find.mockResolvedValueOnce([]);
      expect(await client.countRealmAdminContacts(realm)).toBe(0);
    });
  });
});
