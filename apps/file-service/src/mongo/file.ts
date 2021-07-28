import { Model, model } from 'mongoose';
import { Results, decodeAfter, encodeNext } from '@core-services/core-common';
import { FileRepository, FileCriteria, FileEntity, FileSpaceRepository } from '../file';
import { FileTypeEntity } from '../file/model/type';
import { fileSchema } from './schema';
import { FileDoc } from './types';
interface queryProps {
  spaceId: string;
  typeId: string;
  filename: { $regex: string; $options: string };
  scanned: boolean;
  deleted: boolean;
}
export class MongoFileRepository implements FileRepository {
  private model: Model<FileDoc>;

  constructor(private spaceRepository: FileSpaceRepository) {
    this.model = model('file', fileSchema);
  }

  async exists(criteria: FileCriteria): Promise<boolean> {
    const query: queryProps = this.getQuery(criteria);
    const result = await this.model.findOne({
      where: query,
    });

    return !!result === true;
  }

  find(top: number, after: string, criteria: FileCriteria): Promise<Results<FileEntity>> {
    const skip = decodeAfter(after);
    const query: queryProps = this.getQuery(criteria);

    return new Promise<FileEntity[]>((resolve, reject) => {
      this.model
        .find(query, null, { lean: true })
        .skip(skip)
        .limit(top)
        .exec((err, docs) =>
          err
            ? reject(err)
            : resolve(
                Promise.all(
                  docs.map((doc) =>
                    this.spaceRepository
                      .getType(doc.spaceId, doc.typeId)
                      .then((type) => this.fromDoc(type, doc as FileDoc))
                  )
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
      this.model.findOne({ _id: id }, null, { lean: true }, (err, doc) => {
        if (err) {
          reject(err);
        } else if (!doc) {
          resolve(null);
        } else {
          this.spaceRepository
            .getType(doc.spaceId, doc.typeId)
            .then((fileType) => resolve(this.fromDoc(fileType, doc)));
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
      ? new FileEntity(this, type, {
          id: values._id,
          recordId: values.recordId,
          filename: values.filename,
          size: values.size,
          storage: values.storage,
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
      spaceId: entity.type.spaceId,
      typeId: entity.type.id,
      recordId: entity.recordId,
      filename: entity.filename,
      size: entity.size,
      storage: entity.storage,
      createdBy: entity.createdBy,
      created: entity.created,
      lastAccessed: entity.lastAccessed,
      scanned: entity.scanned,
      deleted: entity.deleted,
    };
  }

  getQuery(criteria: FileCriteria): queryProps {
    const query = {} as queryProps;

    if (criteria.spaceEquals) {
      query.spaceId = criteria.spaceEquals;
    }

    if (criteria.typeEquals) {
      query.typeId = criteria.typeEquals;
    }

    if (criteria.scanned) {
      query.scanned = criteria.scanned;
    }

    if (criteria.deleted) {
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
