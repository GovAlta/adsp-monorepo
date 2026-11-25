import { AdspId } from '@abgov/adsp-service-sdk';
import { CredentialUnreadableError } from '../errors';
import { decryptSecret, encryptSecret, EncryptionKey, EncryptionKeyring } from './crypto';
import { CredentialRepository, StoredCredential } from './repository';

export interface CredentialStatus {
  isSet: boolean;
  updatedAt?: Date;
}

export interface ReencryptionResult {
  /** Secrets found on an older key version. */
  checked: number;
  converted: number;
  /** Secrets saved again by a tenant admin during the run; they are already on the current key. */
  changedDuringRun: number;
  /** Secrets on a version neither key matches, or that fail to decrypt. Tenants must enter these again. */
  failed: number;
}

export class CredentialStore {
  constructor(
    private repository: CredentialRepository,
    private keys: EncryptionKeyring,
  ) {}

  /** Version of the key that new and replaced secrets are encrypted with. */
  get keyVersion(): number {
    return this.keys.current.version;
  }

  private aad(tenantId: string, connectionId: string): string {
    return `${tenantId}:${connectionId}`;
  }

  private keyFor(version: number): EncryptionKey | undefined {
    return [this.keys.current, this.keys.previous].find((key) => key?.version === version);
  }

  /** Returns null when no key matches the record's version or the record fails to decrypt for this tenant and connection. */
  private tryDecrypt(record: StoredCredential, tenantId: string, connectionId: string): string | null {
    const key = this.keyFor(record.keyVersion);
    if (!key) {
      return null;
    }
    try {
      return decryptSecret(key, this.aad(tenantId, connectionId), record);
    } catch {
      return null;
    }
  }

  async set(tenantId: AdspId, connectionId: string, clientSecret: string): Promise<CredentialStatus> {
    const saved = await this.repository.save({
      tenantId: tenantId.toString(),
      connectionId,
      ...encryptSecret(this.keys.current, this.aad(tenantId.toString(), connectionId), clientSecret),
      updatedAt: new Date(),
    });
    return { isSet: true, updatedAt: saved.updatedAt };
  }

  async status(tenantId: AdspId, connectionId: string): Promise<CredentialStatus> {
    const record = await this.repository.get(tenantId, connectionId);
    return record ? { isSet: true, updatedAt: record.updatedAt } : { isSet: false };
  }

  remove(tenantId: AdspId, connectionId: string): Promise<boolean> {
    return this.repository.delete(tenantId, connectionId);
  }

  async getSecret(tenantId: AdspId, connectionId: string): Promise<string | null> {
    const record = await this.repository.get(tenantId, connectionId);
    if (!record) {
      return null;
    }
    const secret = this.tryDecrypt(record, tenantId.toString(), connectionId);
    if (secret === null) {
      throw new CredentialUnreadableError(connectionId);
    }
    return secret;
  }

  /** Re-encrypts every secret on an older key version with the current key, keeping its updated date. */
  async reencrypt(): Promise<ReencryptionResult> {
    const outdated = await this.repository.findNotOnKeyVersion(this.keys.current.version);
    const result: ReencryptionResult = { checked: outdated.length, converted: 0, changedDuringRun: 0, failed: 0 };

    for (const record of outdated) {
      const secret = this.tryDecrypt(record, record.tenantId, record.connectionId);
      if (secret === null) {
        result.failed++;
        continue;
      }
      const reencrypted = encryptSecret(this.keys.current, this.aad(record.tenantId, record.connectionId), secret);
      if (await this.repository.replaceIfUnchanged(record, reencrypted)) {
        result.converted++;
      } else {
        result.changedDuringRun++;
      }
    }
    return result;
  }
}
