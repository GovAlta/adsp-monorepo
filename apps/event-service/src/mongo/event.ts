import { decodeAfter, Doc, encodeNext, Results } from '@core-services/core-common';
import { Document, Model, model } from 'mongoose';
import { EventDefinitionEntity, EventRepository, Namespace, NamespaceEntity } from '../event';
import { namespaceSchema } from './schema';

export class MongoEventRepository implements EventRepository {
  model: Model<Document>;
  constructor() {
    this.model = model('eventnamespace', namespaceSchema);
  }

  getNamespace(name: string): Promise<NamespaceEntity> {
    return new Promise<NamespaceEntity>((resolve, reject) =>
      this.model.findOne({ name }, null, { lean: true }, (err, doc: unknown) =>
        err ? reject(err) : resolve(this.fromDoc(doc as Doc<Namespace>))
      )
    );
  }

  getNamespaces(top: number, after: string): Promise<Results<NamespaceEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<NamespaceEntity>>((resolve, reject) => {
      this.model
        .find({}, null, { lean: true })
        .skip(skip)
        .limit(top)
        .exec((err, docs) =>
          err
            ? reject(err)
            : resolve({
                results: docs.map((doc: unknown) => this.fromDoc(doc as Doc<Namespace>)),
                page: {
                  after,
                  next: encodeNext(docs.length, top, skip),
                  size: docs.length,
                },
              })
        );
    });
  }

  getDefinition(namespace: string, name: string): Promise<EventDefinitionEntity> {
    return this.getNamespace(namespace).then((entity) => entity && entity.definitions[name]);
  }

  save(entity: NamespaceEntity): Promise<NamespaceEntity> {
    return new Promise<NamespaceEntity>((resolve, reject) =>
      this.model.findOneAndUpdate(
        { name: entity.name },
        this.toDoc(entity),
        { upsert: true, new: true, lean: true },
        (err, doc: unknown) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.fromDoc(doc as Doc<Namespace>));
          }
        }
      )
    );
  }

  private toDoc(entity: NamespaceEntity): Doc<Namespace> {
    return {
      name: entity.name,
      description: entity.description,
      adminRole: entity.adminRole,
      definitions: Object.entries(entity.definitions).reduce(
        (defs, [key, def]) => ({
          ...defs,
          [key]: {
            name: key,
            description: def.description,
            sendRoles: def.sendRoles,
            payloadSchema: def.payloadSchema,
          },
        }),
        {}
      ),
    };
  }

  private fromDoc(doc: Doc<Namespace>): NamespaceEntity {
    return doc
      ? new NamespaceEntity(this, {
          name: doc.name,
          description: doc.description,
          adminRole: doc.adminRole,
          definitions: doc.definitions,
        })
      : null;
  }
}
