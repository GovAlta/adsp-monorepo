import _ from 'lodash';
import delegate from 'delegates';
import { errors } from '@strapi/database';
import { errors as errors$1, contentTypes, relations } from '@strapi/utils';

const transformLoadParamsToQuery = (uid, field, params, pagination = {})=>{
    const query = strapi.get('query-params').transform(uid, {
        populate: {
            [field]: params
        }
    });
    const res = {
        ...query.populate[field],
        ...pagination
    };
    return res;
};
const databaseErrorsToTransform = [
    errors.InvalidTimeError,
    errors.InvalidDateTimeError,
    errors.InvalidDateError,
    errors.InvalidRelationError
];
const createDefaultImplementation = ({ strapi: strapi1, db })=>({
        async wrapParams (options = {}) {
            return options;
        },
        async wrapResult (result = {}) {
            return result;
        },
        async findMany (uid, opts) {
            const { kind } = strapi1.getModel(uid);
            const wrappedParams = await this.wrapParams(opts, {
                uid,
                action: 'findMany'
            });
            if (kind === 'singleType') {
                const entity = strapi1.documents(uid).findFirst(wrappedParams);
                return this.wrapResult(entity, {
                    uid,
                    action: 'findOne'
                });
            }
            const entities = await strapi1.documents(uid).findMany(wrappedParams);
            return this.wrapResult(entities, {
                uid,
                action: 'findMany'
            });
        },
        async findPage (uid, opts) {
            const wrappedParams = await this.wrapParams(opts, {
                uid,
                action: 'findPage'
            });
            const query = strapi1.get('query-params').transform(uid, wrappedParams);
            const entities = await db.query(uid).findPage(query);
            return this.wrapResult(entities, {
                uid,
                action: 'findMany'
            });
        },
        async findOne (uid, entityId, opts) {
            const wrappedParams = await this.wrapParams(opts, {
                uid,
                action: 'findOne'
            });
            const res = await db.query(uid).findOne({
                where: {
                    id: entityId
                }
            });
            if (!res) {
                return this.wrapResult(null, {
                    uid,
                    action: 'findOne'
                });
            }
            const entity = await strapi1.documents(uid).findOne({
                ...wrappedParams,
                documentId: res.documentId
            });
            return this.wrapResult(entity, {
                uid,
                action: 'findOne'
            });
        },
        async count (uid, opts) {
            const wrappedParams = await this.wrapParams(opts, {
                uid,
                action: 'count'
            });
            return strapi1.documents(uid).count(wrappedParams);
        },
        async create (uid, params) {
            const wrappedParams = await this.wrapParams(params, {
                uid,
                action: 'create'
            });
            const { data } = wrappedParams;
            if (!data) {
                throw new Error('cannot create');
            }
            const shouldPublish = !contentTypes.isDraft(data, strapi1.getModel(uid));
            const entity = await strapi1.documents(uid).create({
                ...wrappedParams,
                status: shouldPublish ? 'published' : 'draft'
            });
            return this.wrapResult(entity, {
                uid,
                action: 'create'
            });
        },
        async update (uid, entityId, opts) {
            const wrappedParams = await this.wrapParams(opts, {
                uid,
                action: 'update'
            });
            const entityToUpdate = await db.query(uid).findOne({
                where: {
                    id: entityId
                }
            });
            if (!entityToUpdate) {
                return this.wrapResult(null, {
                    uid,
                    action: 'update'
                });
            }
            const shouldPublish = !contentTypes.isDraft(entityToUpdate, strapi1.getModel(uid));
            const entity = strapi1.documents(uid).update({
                ...wrappedParams,
                status: shouldPublish ? 'published' : 'draft',
                documentId: entityToUpdate.documentId
            });
            return this.wrapResult(entity, {
                uid,
                action: 'update'
            });
        },
        async delete (uid, entityId, opts) {
            const wrappedParams = await this.wrapParams(opts, {
                uid,
                action: 'delete'
            });
            const entityToDelete = await db.query(uid).findOne({
                where: {
                    id: entityId
                }
            });
            if (!entityToDelete) {
                return this.wrapResult(null, {
                    uid,
                    action: 'delete'
                });
            }
            await strapi1.documents(uid).delete({
                ...wrappedParams,
                documentId: entityToDelete.documentId
            });
            return this.wrapResult(entityToDelete, {
                uid,
                action: 'delete'
            });
        },
        async load (uid, entity, field, params) {
            if (!_.isString(field)) {
                throw new Error(`Invalid load. Expected "${field}" to be a string`);
            }
            const loadedEntity = await db.query(uid).load(entity, field, transformLoadParamsToQuery(uid, field, params ?? {}));
            return this.wrapResult(loadedEntity, {
                uid,
                field,
                action: 'load'
            });
        },
        async loadPages (uid, entity, field, params, pagination = {}) {
            if (!_.isString(field)) {
                throw new Error(`Invalid load. Expected "${field}" to be a string`);
            }
            const { attributes } = strapi1.getModel(uid);
            const attribute = attributes[field];
            if (!relations.isAnyToMany(attribute)) {
                throw new Error(`Invalid load. Expected "${field}" to be an anyToMany relational attribute`);
            }
            const query = transformLoadParamsToQuery(uid, field, params ?? {}, pagination);
            const loadedPage = await db.query(uid).loadPages(entity, field, query);
            return {
                ...loadedPage,
                results: await this.wrapResult(loadedPage.results, {
                    uid,
                    field,
                    action: 'load'
                })
            };
        }
    });
var createEntityService = ((ctx)=>{
    const implementation = createDefaultImplementation(ctx);
    const service = {
        implementation,
        decorate (decorator) {
            if (typeof decorator !== 'function') {
                throw new Error(`Decorator must be a function, received ${typeof decorator}`);
            }
            this.implementation = {
                ...this.implementation,
                ...decorator(this.implementation)
            };
            return this;
        }
    };
    const delegator = delegate(service, 'implementation');
    // delegate every method in implementation
    Object.keys(service.implementation).forEach((key)=>delegator.method(key));
    // wrap methods to handle Database Errors
    service.decorate((oldService)=>{
        const newService = _.mapValues(oldService, (method, methodName)=>async function(...args) {
                try {
                    return await oldService[methodName].call(this, ...args);
                } catch (error) {
                    if (databaseErrorsToTransform.some((errorToTransform)=>error instanceof errorToTransform)) {
                        if (error instanceof Error) {
                            throw new errors$1.ValidationError(error.message);
                        }
                        throw error;
                    }
                    throw error;
                }
            });
        return newService;
    });
    return service;
});

export { createEntityService as default };
//# sourceMappingURL=index.mjs.map
