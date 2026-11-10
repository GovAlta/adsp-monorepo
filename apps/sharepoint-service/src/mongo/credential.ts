import { AdspId } from '@abgov/adsp-service-sdk';
import { Model, model, models, Schema } from 'mongoose';
import { CredentialRepository, StoredCredential } from '../sharepoint/credentials';

const credentialSchema = new Schema<StoredCredential>(
  {
    tenantId: { type: String, required: true },
    connectionId: { type: String, required: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    keyVersion: { type: Number, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);
credentialSchema.index({ tenantId: 1, connectionId: 1 }, { unique: true });

export class MongoCredentialRepository implements CredentialRepository {
  private model: Model<StoredCredential>;

  constructor() {
    this.model =
      (models.sharepointCredential as Model<StoredCredential>) ||
      model<StoredCredential>('sharepointCredential', credentialSchema);
  }

  async get(tenantId: AdspId, connectionId: string): Promise<StoredCredential | null> {
    const doc = await this.model.findOne({ tenantId: tenantId.toString(), connectionId }, { _id: 0 }).lean().exec();
    return (doc as StoredCredential) ?? null;
  }

  async save(credential: StoredCredential): Promise<StoredCredential> {
    await this.model
      .updateOne({ tenantId: credential.tenantId, connectionId: credential.connectionId }, credential, { upsert: true })
      .exec();
    return credential;
  }

  async delete(tenantId: AdspId, connectionId: string): Promise<boolean> {
    const { deletedCount } = await this.model.deleteOne({ tenantId: tenantId.toString(), connectionId }).exec();
    return deletedCount > 0;
  }
}
