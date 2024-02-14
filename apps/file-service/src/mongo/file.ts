import { AdspId } from '@abgov/adsp-service-sdk';
import { Results, decodeAfter, encodeNext } from '@core-services/core-common';
import { Model, model } from 'mongoose';
import {
  FileRepository,
  FileCriteria,
  FileEntity,
  FileTypeEntity,
  FileStorageProvider,
  FileTypeRepository,
} from '../file';
import { fileSchema } from './schema';
import { FileDoc } from './types';

interface QueryProps {
  spaceId: string;
  typeId: string;
  filename: { $regex: string; $options: string };
  scanned: boolean;
  deleted: boolean;
  infected: boolean;
  recordId: string;
  lastAccessed?: {
    $gt?: string;
    $lt?: string;
  };
}

export class MongoFileRepository implements FileRepository {
  private model: Model<FileDoc>;

  constructor(private storageProvider: FileStorageProvider, private typeRepository: FileTypeRepository) {
    this.model = model<FileDoc>('file', fileSchema);
  }

  async find(tenantId: AdspId, top: number, after: string, criteria: FileCriteria): Promise<Results<FileEntity>> {
    const skip = decodeAfter(after);
    const query: QueryProps = this.getQuery(tenantId, criteria);

    const types = await this.typeRepository.getTypes(tenantId);
    const docs = await this.model.find(query, null, { lean: true }).skip(skip).limit(top).sort({ created: -1 }).exec();
    const results = docs.map((doc) => this.fromDoc(types[doc.typeId], doc as FileDoc));

    return {
      results,
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  get(id: string): Promise<FileEntity> {
    return new Promise<FileEntity>((resolve, reject) =>
      this.model.findOne({ _id: id }, null, { lean: true }, async (err, doc) => {
        if (err) {
          reject(err);
        } else if (!doc || !doc.spaceId) {
          resolve(null);
        } else {
          const type = await this.typeRepository.getType(AdspId.parse(doc.spaceId), doc.typeId);
          resolve(this.fromDoc(type, doc));
        }
      })
    );
  }

  save(entity: FileEntity, update?: Partial<FileEntity>): Promise<FileEntity> {
    return new Promise<FileEntity>((resolve, reject) =>
      this.model.findOneAndUpdate(
        { _id: entity.id },
        this.toDoc(update || entity),
        { upsert: true, new: true, lean: true, omitUndefined: true },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.fromDoc(entity.type, doc));
          }
        }
      )
    );
  }

  delete(entity: FileEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.model.findOneAndDelete({ _id: entity.id }, null, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    );
  }

  fromDoc(type: FileTypeEntity, values: FileDoc): FileEntity {
    return values
      ? new FileEntity(this.storageProvider, this, type, {
          tenantId: values.spaceId ? AdspId.parse(values.spaceId) : null,
          id: values._id,
          recordId: values.recordId,
          filename: values.filename,
          size: values.size,
          mimeType: values?.mimeType,
          createdBy: values.createdBy,
          created: values.created,
          lastAccessed: values.lastAccessed,
          scanned: values.scanned,
          infected: values.infected,
          deleted: values.deleted,
          digest: values.digest,
          securityClassification: values?.securityClassification,
        })
      : null;
  }
  // eslint-disable-next-line
  toDoc(update: Partial<FileEntity>): any {
    return {
      spaceId: update.tenantId?.toString() || undefined,
      typeId: update.type?.id || undefined,
      recordId: update.recordId,
      filename: update.filename,
      size: update.size,
      mimeType: update?.mimeType,
      securityClassification: update?.securityClassification,
      createdBy: update.createdBy,
      created: update.created,
      lastAccessed: update.lastAccessed,
      scanned: update.scanned,
      infected: update.infected,
      deleted: update.deleted,
      digest: update.digest,
    };
  }

  getQuery(tenantId: AdspId, criteria: FileCriteria): QueryProps {
    const query = {
      spaceId: tenantId.toString(),
    } as QueryProps;

    if (criteria.typeEquals) {
      query.typeId = criteria.typeEquals;
    }

    if (criteria.recordIdEquals) {
      query.recordId = criteria.recordIdEquals;
    }

    if (criteria.scanned !== undefined) {
      query.scanned = criteria.scanned;
    }

    if (criteria.deleted !== undefined) {
      query.deleted = criteria.deleted;
    }

    if (criteria.infected !== undefined) {
      query.infected = criteria.infected;
    }

    if (criteria.filenameContains) {
      query.filename = {
        $regex: criteria.filenameContains,
        $options: 'i',
      };
    }

    if (criteria?.lastAccessedBefore || criteria?.lastAccessedAfter) {
      query.lastAccessed = {};
      if (criteria?.lastAccessedBefore) {
        query.lastAccessed.$lt = criteria?.lastAccessedBefore;
      }
      if (criteria?.lastAccessedAfter) {
        query.lastAccessed.$gt = criteria?.lastAccessedAfter;
      }
    }
    return query;
  }
}
