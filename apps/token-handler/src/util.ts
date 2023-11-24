import * as crypto from 'crypto';
import { environment } from './environments/environment';

export function createKey(secret: string): Buffer {
  return crypto.scryptSync(secret, environment.SECRET_SALT, 32);
}

export function serializeAndEncrypt(key: Buffer, data: unknown) {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptAndDeserialize(key: Buffer, text: string) {
  const [ivValue, encryptedValue] = text.split(':');
  const iv = Buffer.from(ivValue, 'hex');
  const encrypted = Buffer.from(encryptedValue, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return JSON.parse(decrypted.toString('utf-8'));
}
