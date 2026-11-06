import { randomBytes } from 'crypto';
import { decryptSecret, encryptSecret, parseEncryptionKey } from './crypto';

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
