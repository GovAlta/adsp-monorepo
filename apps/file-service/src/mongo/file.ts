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
  recordId: string;
}

export class MongoFileRepository implements FileRepository {
  private model: Model<FileDoc>;

  constructor(private storageProvider: FileStorageProvider, private typeRepository: FileTypeRepository) {
    this.model = model<FileDoc>('file', fileSchema);
  }

  find(top: number, after: string, criteria: FileCriteria): Promise<Results<FileEntity>> {
    const skip = decodeAfter(after);
    const query: QueryProps = this.getQuery(criteria);

    return new Promise<FileEntity[]>((resolve, reject) => {
      this.model
        .find(query, null, { lean: true })
        .skip(skip)
        .limit(top)
        .sort({ created: -1 })
        .exec((err, docs) =>
          err
            ? reject(err)
            : resolve(
                Promise.all(
                  docs.map(async (doc) => {
                    const type = doc.spaceId
                      ? await this.typeRepository.getType(AdspId.parse(doc.spaceId), doc.typeId)
                      : null;
                    return this.fromDoc(type, doc as FileDoc);
                  })
                )
              )
        );
    }).then((docs) => ({
      results: docs,
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    }));
  }

  get(id: string): Promise<FileEntity> {
    return new Promise<FileEntity>((resolve, reject) =>
      this.model.findOne({ _id: id }, null, { lean: true }, async (err, doc) => {
        if (err) {
          reject(err);
        } else if (!doc) {
          resolve(null);
        } else {
          const type = await this.typeRepository.getType(AdspId.parse(doc.spaceId), doc.typeId);
          resolve(this.fromDoc(type, doc));
        }
      })
    );
  }

  save(entity: FileEntity): Promise<FileEntity> {
    return new Promise<FileEntity>((resolve, reject) =>
      this.model.findOneAndUpdate(
        { _id: entity.id },
        this.toDoc(entity),
        { upsert: true, new: true, lean: true },
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
          createdBy: values.createdBy,
          created: values.created,
          lastAccessed: values.lastAccessed,
          scanned: values.scanned,
          deleted: values.deleted,
        })
      : null;
  }
  // eslint-disable-next-line
  toDoc(entity: FileEntity): any {
    return {
      spaceId: entity.tenantId.toString(),
      typeId: entity.type.id,
      recordId: entity.recordId,
      filename: entity.filename,
      size: entity.size,
      createdBy: entity.createdBy,
      created: entity.created,
      lastAccessed: entity.lastAccessed,
      scanned: entity.scanned,
      deleted: entity.deleted,
    };
  }

  getQuery(criteria: FileCriteria): QueryProps {
    const query = {} as QueryProps;

    if (criteria.tenantEquals) {
      query.spaceId = criteria.tenantEquals;
    }

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

    if (criteria.filenameContains) {
      query.filename = {
        $regex: criteria.filenameContains,
        $options: 'i',
      };
    }
    return query;
  }
}
