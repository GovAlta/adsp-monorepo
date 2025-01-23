import { AdspId } from '@abgov/adsp-service-sdk';
import { Doc, decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { Document, Model, model, PipelineStage, Types } from 'mongoose';
import { Logger } from 'winston';
import { DirectoryEntity, DirectoryRepository } from '../directory';
import { Criteria, Directory, Resource, ResourceCriteria, Tag, TagCriteria } from '../directory/types';
import { directorySchema, resourceSchema, resourceTagSchema, tagSchema } from './schema';
import { ResourceDoc, TagDoc } from './types';

export class MongoDirectoryRepository implements DirectoryRepository {
  private directoryModel;
  private tagModel: Model<TagDoc>;
  private resourceModel: Model<ResourceDoc>;
  private resourceTagModel: Model<Document>;

  constructor(private logger: Logger) {
    this.directoryModel = model('directories', directorySchema);
    this.tagModel = model<TagDoc>('tag', tagSchema, 'directoryTags');
    this.resourceModel = model<ResourceDoc>('resource', resourceSchema, 'directoryResources');
    this.resourceTagModel = model<Document>('resourceTag', resourceTagSchema, 'taggedResources');

    const handleIndexError = (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    };
    this.directoryModel.on('index', handleIndexError);
    this.tagModel.on('index', handleIndexError);
    this.resourceModel.on('index', handleIndexError);
    this.resourceTagModel.on('index', handleIndexError);
  }

  find(top: number, after: string, criteria: Criteria): Promise<Results<DirectoryEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<DirectoryEntity>>((resolve, reject) => {
      this.directoryModel
        .find(criteria, null, { lean: true })
        .skip(skip)
        .limit(top)
        .exec((err, docs) =>
          err
            ? reject(err)
            : resolve({
                results: docs.map((doc) => this.fromDoc(doc)),
                page: {
                  after,
                  next: encodeNext(docs.length, top, skip),
                  size: docs.length,
                },
              })
        );
    });
  }

  get(id: string): Promise<DirectoryEntity> {
    return new Promise<DirectoryEntity>((resolve, reject) =>
      this.directoryModel.findOne({ name: id }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  async save(entity: DirectoryEntity): Promise<DirectoryEntity> {
    try {
      return new Promise<DirectoryEntity>((resolve, reject) =>
        this.directoryModel.findOneAndUpdate(
          { name: entity.name || new Types.ObjectId() },
          this.toDoc(entity),
          { upsert: true, new: true, lean: true },
          (err, doc) => {
            if (err) {
              reject(err);
            } else {
              resolve(this.fromDoc(doc));
            }
          }
        )
      );
    } catch (err) {
      return err.message;
    }
  }

  delete(entity: DirectoryEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.directoryModel.deleteOne({ name: entity.name }, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    );
  }

  getDirectories(name: string): Promise<DirectoryEntity> {
    return new Promise<DirectoryEntity>((resolve, reject) =>
      this.directoryModel.findOne({ name: name }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  update(directory: Directory): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const uniqueServices = [];
      directory.services.forEach((entry) => {
        if (!uniqueServices.map((uniqueService) => uniqueService.service).includes(entry.service)) {
          uniqueServices.push(entry);
        }
      });
      directory.services = uniqueServices;

      return this.directoryModel.findOneAndUpdate({ name: directory.name }, directory, { upsert: true }, (err, doc) =>
        err ? reject(err) : resolve(!!doc)
      );
    });
  }

  async exists(name: string): Promise<boolean> {
    const result = await this.directoryModel.findOne({
      where: { name: name },
    });

    return !!result === true;
  }

  private fromDoc(doc: Doc<Directory>) {
    return doc ? new DirectoryEntity(this, { id: `${doc._id}`, name: doc.name, services: doc.services }) : null;
  }

  private toDoc(entity: DirectoryEntity) {
    return {
      name: entity.name,
      services: entity.services,
    };
  }

  async getTags(top: number, after: string, criteria: TagCriteria): Promise<Results<Tag>> {
    const skip = decodeAfter(after);

    const query: Record<string, unknown> = {};

    // Tenant criteria is either a specific tenant or tags without any tenant context (i.e. core).
    // Querying across different tenants isn't supported.
    query.tenantId = criteria?.tenantIdEquals ? criteria.tenantIdEquals.toString() : { $exists: false };

    let docs: TagDoc[];

    // Resource criteria is mutually exclusive with other criteria except tenant.
    if (!criteria.resourceUrnEquals) {
      if (criteria.valueEquals) {
        query.value = criteria.valueEquals;
      }

      docs = await this.tagModel.find(query, null, { lean: true }).skip(skip).limit(top).exec();
    } else {
      const pipeline: PipelineStage[] = [
        {
          $match: {
            tenantId: query.tenantId,
            urn: criteria.resourceUrnEquals.toString(),
          },
        },
        {
          $lookup: {
            from: 'taggedResources',
            localField: '_id',
            foreignField: 'resourceId',
            as: 'taggedResources',
          },
        },
        {
          $unwind: '$taggedResources',
        },
        {
          $project: {
            _id: false,
            tagId: '$taggedResources.tagId',
          },
        },
        {
          $lookup: {
            from: 'directoryTags',
            localField: 'tagId',
            foreignField: '_id',
            as: 'tags',
          },
        },
        {
          $unwind: '$tags',
        },
        {
          $project: {
            _id: false,
            tenantId: '$tags.tenantId',
            label: '$tags.label',
            value: '$tags.value',
          },
        },
      ];

      docs = await this.resourceModel.aggregate(pipeline).skip(skip).limit(top).exec();
    }

    return {
      results: docs.map(this.fromTagDoc),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  async getTaggedResources(
    tenantId: AdspId,
    tag: string,
    top: number,
    after: string,
    criteria: ResourceCriteria
  ): Promise<Results<Resource>> {
    const skip = decodeAfter(after);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          tenantId: tenantId.toString(),
          value: tag,
        },
      },
      {
        $lookup: {
          from: 'taggedResources',
          localField: '_id',
          foreignField: 'tagId',
          as: 'taggedResources',
        },
      },
      {
        $unwind: '$taggedResources',
      },
      { $skip: skip },
      { $limit: top },
      {
        $project: {
          _id: false,
          resourceId: '$taggedResources.resourceId',
        },
      },
      {
        $lookup: {
          from: 'directoryResources',
          localField: 'resourceId',
          foreignField: '_id',
          as: 'resources',
        },
      },
      {
        $unwind: '$resources',
      },
      {
        $project: {
          _id: false,
          tenantId: '$resources.tenantId',
          urn: '$resources.urn',
          name: '$resources.name',
          description: '$resources.description',
          type: '$resources.type',
        },
      },
    ];

    const query: Record<string, unknown> = {};
    if (criteria) {
      if (criteria.urnEquals) {
        query.urn = criteria.urnEquals.toString();
      }
      if (criteria.typeEquals) {
        query.type = criteria.typeEquals;
      }

      pipeline.push({
        $match: query,
      });
    }

    const docs: ResourceDoc[] = await this.tagModel.aggregate(pipeline).exec();

    return {
      results: docs.map((doc) => this.fromResourceDoc(doc)),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  async applyTag(
    tag: Tag,
    resource: Resource
  ): Promise<{ tag: Tag; resource: Resource; tagged: boolean; isNewResource: boolean }> {
    const tagDoc = await this.tagModel
      .findOneAndUpdate(
        {
          tenantId: tag.tenantId?.toString() || { $exists: false },
          value: tag.value,
        },
        {
          $setOnInsert: {
            _id: new Types.ObjectId(),
            tenantId: tag.tenantId?.toString(),
            value: tag.value,
            label: tag.label,
          },
        },
        { upsert: true, new: true, lean: true }
      )
      .exec();

    const resourceObjectId = new Types.ObjectId();
    const resourceDoc = await this.resourceModel
      .findOneAndUpdate(
        {
          tenantId: resource.tenantId?.toString() || { $exists: false },
          urn: resource.urn.toString(),
        },
        {
          $setOnInsert: {
            _id: resourceObjectId,
            tenantId: resource.tenantId?.toString(),
            urn: resource.urn.toString(),
            name: resource.name,
            description: resource.description,
          },
        },
        { upsert: true, new: true, lean: true }
      )
      .exec();

    const found = await this.resourceTagModel.findOneAndUpdate(
      {
        tagId: tagDoc._id,
        resourceId: resourceDoc._id,
      },
      {
        $setOnInsert: {
          tagId: tagDoc._id,
          resourceId: resourceDoc._id,
        },
      },
      { upsert: true }
    );

    return {
      tag: this.fromTagDoc(tagDoc),
      resource: this.fromResourceDoc(resourceDoc),
      tagged: !found,
      isNewResource: resourceObjectId.equals(resourceDoc._id),
    };
  }

  async removeTag(tag: Tag, resource: Resource): Promise<{ tag?: Tag; resource?: Resource; untagged: boolean }> {
    const tagDoc = await this.tagModel
      .findOne(
        {
          tenantId: tag.tenantId?.toString() || { $exists: false },
          value: tag.value,
        },
        null,
        { lean: true }
      )
      .exec();

    const resourceDoc = await this.resourceModel
      .findOne(
        {
          tenantId: tag.tenantId?.toString() || { $exists: false },
          urn: resource.urn.toString(),
        },
        null,
        { lean: true }
      )
      .exec();

    let deleted = false;
    if (tagDoc && resourceDoc) {
      deleted = !!(await this.resourceTagModel
        .findOneAndDelete({
          tagId: tagDoc._id,
          resourceId: resourceDoc._id,
        })
        .exec());
    }

    return {
      tag: this.fromTagDoc(tagDoc),
      resource: this.fromResourceDoc(resourceDoc),
      untagged: deleted,
    };
  }

  async getResources(top: number, after: string, criteria: ResourceCriteria) {
    const skip = decodeAfter(after);

    const query: Record<string, unknown> = {};

    // Tenant criteria is either a specific tenant or tags without any tenant context (i.e. core).
    // Querying across different tenants isn't supported.
    query.tenantId = criteria?.tenantIdEquals ? criteria.tenantIdEquals.toString() : { $exists: false };

    if (criteria.urnEquals) {
      query.urn = criteria.urnEquals.toString();
    }

    if (criteria.typeEquals) {
      query.type = criteria.typeEquals;
    }

    const docs = await this.resourceModel.find(query).skip(skip).limit(top).exec();

    return {
      results: docs.map(this.fromResourceDoc),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  async saveResource(resource: Resource): Promise<Resource> {
    const doc = await this.resourceModel
      .findOneAndUpdate(
        {
          tenantId: resource.tenantId?.toString() || { $exists: false },
          urn: resource.urn.toString(),
        },
        {
          name: resource.name,
          description: resource.description,
          type: resource.type,
        },
        { lean: true, new: true }
      )
      .exec();

    return this.fromResourceDoc(doc);
  }

  async deleteResource(resource: Resource): Promise<boolean> {
    const deleted = await this.resourceModel
      .findOneAndDelete({
        tenantId: resource.tenantId?.toString() || { $exists: false },
        urn: resource.urn.toString(),
      })
      .exec();

    if (deleted) {
      await this.resourceTagModel.deleteMany({ resourceId: deleted._id }).exec();
    }

    return !!deleted;
  }

  private fromTagDoc(doc: TagDoc): Tag {
    return doc
      ? {
          tenantId: doc.tenantId ? AdspId.parse(doc.tenantId) : null,
          label: doc.label,
          value: doc.value,
        }
      : null;
  }

  private fromResourceDoc(doc: ResourceDoc): Resource {
    return doc
      ? {
          tenantId: doc.tenantId ? AdspId.parse(doc.tenantId) : null,
          urn: doc.urn ? AdspId.parse(doc.urn) : null,
          name: doc.name,
          description: doc.description,
          type: doc.type,
        }
      : null;
  }
}
