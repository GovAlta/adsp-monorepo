import { AdspId } from '@abgov/adsp-service-sdk';
import { decryptSecret, encryptSecret, EncryptionKey } from './crypto';
import { CredentialRepository } from './repository';

export interface CredentialStatus {
  isSet: boolean;
  updatedAt?: Date;
}

export class CredentialStore {
  constructor(
    private repository: CredentialRepository,
    private key: EncryptionKey,
  ) {}

  private aad(tenantId: AdspId, connectionId: string): string {
    return `${tenantId.toString()}:${connectionId}`;
  }

  async set(tenantId: AdspId, connectionId: string, clientSecret: string): Promise<CredentialStatus> {
    const saved = await this.repository.save({
      tenantId: tenantId.toString(),
      connectionId,
      ...encryptSecret(this.key, this.aad(tenantId, connectionId), clientSecret),
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
    return record ? decryptSecret(this.key, this.aad(tenantId, connectionId), record) : null;
  }
}
