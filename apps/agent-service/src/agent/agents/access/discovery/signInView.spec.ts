import { describeSignInBlocker, SignInReads, toIsoTime, toSignInStatus } from './signInView';
import { createProblem } from './types';

const NOW = Date.parse('2026-11-06T12:00:00Z');
const forbidden = { ok: false as const, problem: createProblem('unavailable', 'NO_PERMISSION') };

function reads(overrides: Partial<SignInReads> = {}): SignInReads {
  return {
    user: {
      id: 'id-1',
      username: 'jdoe',
      email: 'jane@example.com',
      enabled: true,
      requiredActions: [],
      federatedIdentities: [{ identityProvider: 'goa-ad', userId: 'idp-user', userName: 'jane@gov.ab.ca' }],
    },
    lockout: {
      ok: true,
      value: { disabled: false, numFailures: 0, lastFailure: 0, failedLoginNotBefore: 0, lastIPFailure: '10.0.0.1' },
    },
    realm: { ok: true, value: { bruteForceProtected: true, permanentLockout: false, smtpServer: { password: 'x' } } },
    credentials: { ok: true, value: [{ type: 'password', secretData: 'hash', userLabel: 'My password' }] },
    sessions: {
      ok: true,
      value: [
        {
          ipAddress: '10.0.0.2',
          start: NOW - 3_600_000,
          lastAccess: NOW - 60_000,
          clients: { 'uuid-1': 'urn:ads:platform:tenant-admin-app' },
        },
      ],
    },
    eventsConfig: { ok: true, value: { eventsEnabled: true } },
    events: {
      ok: true,
      value: [
        {
          type: 'LOGIN_ERROR',
          error: 'invalid_redirect_uri',
          clientId: 'urn:ads:demo:app',
          time: NOW - 120_000,
          ipAddress: '10.0.0.3',
          details: { username: 'jdoe' },
        },
        { type: 'LOGIN', time: NOW - 300_000, clientId: 'urn:ads:demo:app' },
        { type: 'CODE_TO_TOKEN_ERROR', error: 'something_new', time: NOW - 400_000 },
      ],
    },
    ...overrides,
  };
}

describe('toIsoTime', () => {
  it.each([
    [0, undefined],
    [undefined, undefined],
    ['1', undefined],
    [NOW, '2026-11-06T12:00:00.000Z'],
  ])('converts %j', (value, expected) => {
    expect(toIsoTime(value)).toBe(expected);
  });
});

describe('toSignInStatus', () => {
  it('explains sign-in status without IP addresses, emails, typed usernames or credential values', () => {
    const status = toSignInStatus(reads(), NOW);

    expect(status).toEqual({
      enabled: true,
      lockout: {
        protectionOn: true,
        permanent: false,
        lockedOut: false,
        failedAttempts: 0,
        lastFailureAt: undefined,
        lockedUntil: undefined,
      },
      requiredActions: [],
      signInMethods: { identityProviders: ['goa-ad'], password: true, otp: false, securityKey: false },
      sessions: [
        {
          started: '2026-11-06T11:00:00.000Z',
          lastActive: '2026-11-06T11:59:00.000Z',
          apps: ['urn:ads:platform:tenant-admin-app'],
        },
      ],
      history: {
        recording: true,
        lastSignInAt: '2026-11-06T11:55:00.000Z',
        recentErrors: [
          {
            time: '2026-11-06T11:58:00.000Z',
            step: 'Sign-in',
            error: 'invalid_redirect_uri',
            meaning: 'The app sent a return address (redirect URI) that its client does not allow.',
            app: 'urn:ads:demo:app',
          },
          {
            time: '2026-11-06T11:53:20.000Z',
            step: 'Getting a token after sign-in',
            error: 'something_new',
            meaning: undefined,
            app: undefined,
          },
        ],
      },
      notes: [],
    });
    const text = JSON.stringify(status);
    for (const secret of ['10.0.0', 'jane@', 'hash', 'My password', 'idp-user']) {
      expect(text).not.toContain(secret);
    }
  });

  it('reports a temporary lockout with when it ends', () => {
    const lockedUntil = NOW + 600_000;
    const status = toSignInStatus(
      reads({
        lockout: {
          ok: true,
          value: { disabled: true, numFailures: 5, lastFailure: NOW - 1000, failedLoginNotBefore: lockedUntil / 1000 },
        },
      }),
      NOW,
    );

    expect(status.lockout).toMatchObject({
      lockedOut: true,
      failedAttempts: 5,
      lastFailureAt: '2026-11-06T11:59:59.000Z',
      lockedUntil: '2026-11-06T12:10:00.000Z',
    });
    expect(describeSignInBlocker(status)).toBe(
      'The account is locked after too many failed sign-ins until 2026-11-06T12:10:00.000Z.',
    );
  });

  it('explains each required action, with a fallback for unknown ones', () => {
    const status = toSignInStatus(
      reads({ user: { enabled: true, requiredActions: ['VERIFY_EMAIL', 'custom-step'] } }),
      NOW,
    );

    expect(status.requiredActions).toEqual([
      { action: 'VERIFY_EMAIL', meaning: 'Must confirm their email address from the link Keycloak sends.' },
      { action: 'custom-step', meaning: 'Must complete this step at their next sign-in.' },
    ]);
  });

  it('counts an authenticator app from either the credentials or the user flag', () => {
    expect(
      toSignInStatus(reads({ credentials: { ok: true, value: [{ type: 'otp' }] } }), NOW).signInMethods,
    ).toMatchObject({ password: false, otp: true });
    expect(toSignInStatus(reads({ user: { totp: true } }), NOW).signInMethods.otp).toBe(true);
  });

  it('notes each part that could not be read instead of failing', () => {
    const status = toSignInStatus(
      reads({ realm: forbidden, credentials: forbidden, sessions: forbidden, events: forbidden }),
      NOW,
    );

    expect(status.sessions).toBeUndefined();
    expect(status.history).toBeUndefined();
    expect(status.signInMethods).toEqual({ identityProviders: ['goa-ad'] });
    expect(status.notes).toEqual([
      "Whether your realm's lockout protection is on could not be read; reading it needs the view-realm role.",
      'Which sign-in methods the user has set up could not be read.',
      'Active sessions could not be read.',
      'Sign-in history could not be read; reading it needs the realm-management view-events role.',
    ]);
  });

  it('says when the realm does not record sign-in events', () => {
    const status = toSignInStatus(
      reads({ eventsConfig: { ok: true, value: { eventsEnabled: false } }, events: { ok: true, value: [] } }),
      NOW,
    );

    expect(status.history).toEqual({ recording: false, lastSignInAt: undefined, recentErrors: [] });
  });
});

describe('describeSignInBlocker', () => {
  const base = toSignInStatus(reads(), NOW);

  it.each([
    [{ enabled: false }, 'The account is turned off'],
    [{ lockout: { lockedOut: true } }, 'until an administrator unlocks it'],
    [{ requiredActions: [{ action: 'UPDATE_PASSWORD', meaning: '' }] }, 'must complete a required step'],
    [{}, 'Nothing on the account blocks sign-in'],
  ])('describes %j', (change, text) => {
    expect(describeSignInBlocker({ ...base, ...change })).toContain(text);
  });
});
