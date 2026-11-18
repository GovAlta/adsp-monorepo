import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface EncryptionKey {
  version: number;
  key: Buffer;
}

// New secrets are encrypted with the current key; the previous key only reads secrets not yet re-encrypted.
export interface EncryptionKeyring {
  current: EncryptionKey;
  previous?: EncryptionKey;
}

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

const ALGORITHM = 'aes-256-gcm';

export function parseEncryptionKey(base64: string, version: number, name = 'CREDENTIALS_KEY'): EncryptionKey {
  const key = Buffer.from(base64 || '', 'base64');
  if (key.length !== 32) {
    throw new Error(`${name} must be a base64 encoded 32 byte key.`);
  }
  return { version, key };
}

interface KeyringSettings {
  CREDENTIALS_KEY: string;
  CREDENTIALS_KEY_VERSION: number;
  CREDENTIALS_KEY_PREVIOUS: string;
  CREDENTIALS_KEY_PREVIOUS_VERSION: number;
}

export function parseEncryptionKeyring({
  CREDENTIALS_KEY,
  CREDENTIALS_KEY_VERSION,
  CREDENTIALS_KEY_PREVIOUS,
  CREDENTIALS_KEY_PREVIOUS_VERSION,
}: KeyringSettings): EncryptionKeyring {
  const current = parseEncryptionKey(CREDENTIALS_KEY, CREDENTIALS_KEY_VERSION);
  if (!CREDENTIALS_KEY_PREVIOUS) {
    return { current };
  }
  if (!CREDENTIALS_KEY_PREVIOUS_VERSION) {
    throw new Error('CREDENTIALS_KEY_PREVIOUS_VERSION is required with CREDENTIALS_KEY_PREVIOUS.');
  }
  if (CREDENTIALS_KEY_PREVIOUS_VERSION === CREDENTIALS_KEY_VERSION) {
    throw new Error('CREDENTIALS_KEY_PREVIOUS_VERSION must differ from CREDENTIALS_KEY_VERSION.');
  }
  return {
    current,
    previous: parseEncryptionKey(CREDENTIALS_KEY_PREVIOUS, CREDENTIALS_KEY_PREVIOUS_VERSION, 'CREDENTIALS_KEY_PREVIOUS'),
  };
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
