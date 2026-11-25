import { deriveStatus, revokePreviousSecret, rotateClient } from './actions';
import { ATTRIBUTES } from './keycloak';

describe('revokePreviousSecret', () => {
  const now = new Date('2026-06-01T00:00:00Z');

  it('invalidates the previous secret and marks the revoke as announced for that rotation', async () => {
    const lastRotated = new Date('2026-05-30T00:00:00Z');
    const keycloak = { invalidatePreviousSecret: jest.fn(), setAttributes: jest.fn() };

    await revokePreviousSecret(keycloak as never, 'r', { id: '1', state: { lastRotated } }, now);

    expect(keycloak.invalidatePreviousSecret).toHaveBeenCalledWith('r', '1');
    expect(keycloak.setAttributes).toHaveBeenCalledWith('r', '1', {
      [ATTRIBUTES.revokedNoticeSentFor]: lastRotated.toISOString(),
    });
  });

  it('falls back to now when the last rotation is unknown', async () => {
    const keycloak = { invalidatePreviousSecret: jest.fn(), setAttributes: jest.fn() };

    await revokePreviousSecret(keycloak as never, 'r', { id: '1', state: {} }, now);

    expect(keycloak.setAttributes).toHaveBeenCalledWith('r', '1', {
      [ATTRIBUTES.revokedNoticeSentFor]: now.toISOString(),
    });
  });
});

describe('deriveStatus', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const past = new Date('2026-05-01T00:00:00Z');
  const future = new Date('2026-07-01T00:00:00Z');

  it('is failed once the secret expired', () => {
    expect(deriveStatus({ expiry: past }, now)).toBe('failed');
  });

  it('is rotated while the previous secret still works', () => {
    expect(deriveStatus({ expiry: future, rotatedExpiry: future }, now)).toBe('rotated');
  });

  it('is notice-sent when the notice covers the current expiry', () => {
    expect(deriveStatus({ expiry: future, noticeSentFor: new Date(future) }, now)).toBe('notice-sent');
  });

  it('is ok otherwise', () => {
    expect(deriveStatus({ expiry: future, noticeSentFor: past }, now)).toBe('ok');
    expect(deriveStatus({}, now)).toBe('ok');
  });
});

describe('rotateClient', () => {
  it('regenerates, records the rotation and returns the new dates without a secret', async () => {
    const expiry = new Date('2026-09-01T00:00:00Z');
    const rotatedExpiry = new Date('2026-06-08T00:00:00Z');
    const keycloak = {
      regenerateSecret: jest.fn(),
      getClient: jest.fn().mockResolvedValue({ state: { expiry, rotatedExpiry } }),
      setAttributes: jest.fn(),
    };
    const now = new Date('2026-06-01T00:00:00Z');

    const result = await rotateClient(keycloak as never, 'r', { id: '1', clientId: 'c' }, now);

    expect(keycloak.regenerateSecret).toHaveBeenCalledWith('r', '1');
    expect(keycloak.setAttributes).toHaveBeenCalledWith('r', '1', { [ATTRIBUTES.lastRotated]: now.toISOString() });
    expect(result).toEqual({ expiry, overlapEndsAt: rotatedExpiry });
  });
});
