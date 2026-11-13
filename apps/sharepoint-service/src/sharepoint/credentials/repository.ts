import { AdspId } from '@abgov/adsp-service-sdk';
import { EncryptedSecret } from './crypto';

export interface StoredCredential extends EncryptedSecret {
  tenantId: string;
  connectionId: string;
  updatedAt: Date;
}

export interface CredentialRepository {
  get(tenantId: AdspId, connectionId: string): Promise<StoredCredential | null>;
  save(credential: StoredCredential): Promise<StoredCredential>;
  delete(tenantId: AdspId, connectionId: string): Promise<boolean>;
}
