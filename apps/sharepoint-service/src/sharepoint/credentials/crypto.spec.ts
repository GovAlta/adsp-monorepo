import { randomBytes } from 'crypto';
import { decryptSecret, encryptSecret, parseEncryptionKey, parseEncryptionKeyring } from './crypto';

describe('credential crypto', () => {
  const key = parseEncryptionKey(randomBytes(32).toString('base64'), 1);

  it('round trips a secret', () => {
    const encrypted = encryptSecret(key, 'tenant:conn', 's3cret');
    expect(encrypted.ciphertext).not.toContain('s3cret');
    expect(decryptSecret(key, 'tenant:conn', encrypted)).toBe('s3cret');
  });

  it('uses a new IV each time', () => {
    expect(encryptSecret(key, 'a', 'x').iv).not.toBe(encryptSecret(key, 'a', 'x').iv);
  });

  it('throws when the ciphertext is tampered with', () => {
    const encrypted = encryptSecret(key, 'a', 's3cret');
    const tampered = Buffer.from(encrypted.ciphertext, 'base64');
    tampered[0] ^= 0xff;
    expect(() => decryptSecret(key, 'a', { ...encrypted, ciphertext: tampered.toString('base64') })).toThrow();
  });

  it('throws when the additional authenticated data does not match', () => {
    const encrypted = encryptSecret(key, 'tenant-a:conn', 's3cret');
    expect(() => decryptSecret(key, 'tenant-b:conn', encrypted)).toThrow();
  });

  it('throws on a key version mismatch', () => {
    const other = parseEncryptionKey(randomBytes(32).toString('base64'), 2);
    expect(() => decryptSecret(other, 'a', encryptSecret(key, 'a', 'x'))).toThrow(/key version 1/);
  });

  it('rejects keys that are not 32 bytes', () => {
    expect(() => parseEncryptionKey(randomBytes(16).toString('base64'), 1)).toThrow(/32 byte/);
    expect(() => parseEncryptionKey('', 1)).toThrow(/32 byte/);
  });
});

describe('parseEncryptionKeyring', () => {
  const current = randomBytes(32).toString('base64');
  const previous = randomBytes(32).toString('base64');
  const settings = {
    CREDENTIALS_KEY: current,
    CREDENTIALS_KEY_VERSION: 2,
    CREDENTIALS_KEY_PREVIOUS: '',
    CREDENTIALS_KEY_PREVIOUS_VERSION: 0,
  };

  it('has only a current key when no previous key is set', () => {
    const keys = parseEncryptionKeyring(settings);
    expect(keys.current.version).toBe(2);
    expect(keys.previous).toBeUndefined();
  });

  it('adds the previous key with its version', () => {
    const keys = parseEncryptionKeyring({
      ...settings,
      CREDENTIALS_KEY_PREVIOUS: previous,
      CREDENTIALS_KEY_PREVIOUS_VERSION: 1,
    });
    expect(keys.previous.version).toBe(1);
    expect(keys.previous.key.equals(Buffer.from(previous, 'base64'))).toBe(true);
  });

  it('requires a version for the previous key, different from the current one', () => {
    expect(() => parseEncryptionKeyring({ ...settings, CREDENTIALS_KEY_PREVIOUS: previous })).toThrow(
      /CREDENTIALS_KEY_PREVIOUS_VERSION is required/,
    );
    expect(() =>
      parseEncryptionKeyring({ ...settings, CREDENTIALS_KEY_PREVIOUS: previous, CREDENTIALS_KEY_PREVIOUS_VERSION: 2 }),
    ).toThrow(/must differ/);
  });

  it('names the previous key when it is not 32 bytes', () => {
    expect(() =>
      parseEncryptionKeyring({ ...settings, CREDENTIALS_KEY_PREVIOUS: 'short', CREDENTIALS_KEY_PREVIOUS_VERSION: 1 }),
    ).toThrow(/CREDENTIALS_KEY_PREVIOUS must be/);
  });
});
