import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface EncryptionKey {
  version: number;
  key: Buffer;
}

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

const ALGORITHM = 'aes-256-gcm';

export function parseEncryptionKey(base64: string, version: number): EncryptionKey {
  const key = Buffer.from(base64 || '', 'base64');
  if (key.length !== 32) {
    throw new Error('CREDENTIALS_KEY must be a base64 encoded 32 byte key.');
  }
  return { version, key };
}

export function encryptSecret({ version, key }: EncryptionKey, aad: string, plaintext: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    keyVersion: version,
  };
}

export function decryptSecret({ version, key }: EncryptionKey, aad: string, secret: EncryptedSecret): string {
  if (secret.keyVersion !== version) {
    throw new Error(
      `Credential was encrypted with key version ${secret.keyVersion}, but version ${version} is loaded.`,
    );
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(secret.iv, 'base64'));
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(Buffer.from(secret.authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(secret.ciphertext, 'base64')), decipher.final()]).toString('utf8');
}
