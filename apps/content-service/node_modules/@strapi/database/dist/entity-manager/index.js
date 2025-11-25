'use strict';

var _ = require('lodash/fp');
var types = require('../utils/types.js');
var index = require('../fields/index.js');
var queryBuilder = require('../query/query-builder.js');
var entityRepository = require('./entity-repository.js');
var morphRelations = require('./morph-relations.js');
var relations = require('../metadata/relations.js');
require('../utils/identifiers/index.js');
var regularRelations = require('./regular-relations.js');
var relationsOrderer = require('./relations-orderer.js');

const isRecord = (value)=>_.isObject(value) && !_.isNil(value);
const toId = (value)=>{
    if (isRecord(value) && 'id' in value && isValidId(value.id)) {
        return value.id;
    }
    if (isValidId(value)) {
        return value;
    }
    throw new Error(`Invalid id, expected a string or integer, got ${JSON.stringify(value)}`);
};
const toIds = (value)=>_.castArray(value || []).map(toId);
const isValidId = (value)=>_.isString(value) || _.isInteger(value);
const isValidObjectId = (value)=>isRecord(value) && 'id' in value && isValidId(value.id);
const toIdArray = (data)=>{
    const array = _.castArray(data).filter((datum)=>!_.isNil(datum)).map((datum)=>{
        // if it is a string or an integer return an obj with id = to datum
        if (isValidId(datum)) {
            return {
                id: datum,
                __pivot: {}
            };
        }
        // if it is an object check it has at least a valid id
        if (!isValidObjectId(datum)) {
            throw new Error(`Invalid id, expected a string or integer, got ${datum}`);
        }
        return datum;
    });
    return _.uniqWith(_.isEqual, array);
};
const toAssocs = (data)=>{
    if (_.isArray(data) || _.isString(data) || _.isNumber(data) || _.isNull(data) || isRecord(data) && 'id' in data) {
        return {
            set: _.isNull(data) ? data : toIdArray(data)
        };
    }
    if (data?.set) {
        return {
            set: _.isNull(data.set) ? data.set : toIdArray(data.set)
        };
    }
    return {
        options: {
            strict: data?.options?.strict
        },
        connect: toIdArray(data?.connect).map((elm)=>({
                id: elm.id,
                position: elm.position ? elm.position : {
                    end: true
                },
                __pivot: elm.__pivot ?? {},
                __type: elm.__type
            })),
        disconnect: toIdArray(data?.disconnect)
    };
};
const processData = (metadata, data = {}, { withDefaults = false } = {})=>{
    const { attributes } = metadata;
    const obj = {};
    for (const attributeName of Object.keys(attributes)){
        const attribute = attributes[attributeName];
        if (types.isScalarAttribute(attribute)) {
            const field = index.createField(attribute);
            if (_.isUndefined(data[attributeName])) {
                if (!_.isUndefined(attribute.default) && withDefaults) {
                    if (typeof attribute.default === 'function') {
                        obj[attributeName] = attribute.default();
                    } else {
                        obj[attributeName] = attribute.default;
                    }
                }
                continue;
            }
            if ('validate' in field && typeof field.validate === 'function' && data[attributeName] !== null) {
                field.validate(data[attributeName]);
            }
            const val = data[attributeName] === null ? null : field.toDB(data[attributeName]);
            obj[attributeName] = val;
        }
        if (types.isRelationalAttribute(attribute)) {
            // oneToOne & manyToOne
            if ('joinColumn' in attribute && attribute.joinColumn && attribute.owner) {
                const joinColumnName = attribute.joinColumn.name;
                // allow setting to null
                const attrValue = !_.isUndefined(data[attributeName]) ? data[attributeName] : data[joinColumnName];
                if (_.isNull(attrValue)) {
                    obj[joinColumnName] = attrValue;
                } else if (!_.isUndefined(attrValue)) {
                    obj[joinColumnName] = toId(attrValue);
                }
                continue;
            }
            if ('morphColumn' in attribute && attribute.morphColumn && attribute.owner) {
                const { idColumn, typeColumn, typeField = '__type' } = attribute.morphColumn;
                const value = data[attributeName];
                if (value === null) {
                    Object.assign(obj, {
                        [idColumn.name]: null,
                        [typeColumn.name]: null
                    });
                    continue;
                }
                if (!_.isUndefined(value)) {
                    if (!_.has('id', value) || !_.has(typeField, value)) {
                        throw new Error(`Expects properties ${typeField} an id to make a morph association`);
                    }
                    Object.assign(obj, {
                        [idColumn.name]: value.id,
                        [typeColumn.name]: value[typeField]
                    });
                }
            }
        }
    }
    return obj;
};
const createEntityManager = (db)=>{
    const repoMap = {};
    return {
        async findOne (uid, params) {
            const states = await db.lifecycles.run('beforeFindOne', uid, {
                params
            });
            const result = await this.createQueryBuilder(uid).init(params).first().execute();
            await db.lifecycles.run('afterFindOne', uid, {
                params,
                result
            }, states);
            return result;
        },
        // should we name it findOne because people are used to it ?
        async findMany (uid, params) {
            const states = await db.lifecycles.run('beforeFindMany', uid, {
                params
            });
            const result = await this.createQueryBuilder(uid).init(params).execute();
            await db.lifecycles.run('afterFindMany', uid, {
                params,
                result
            }, states);
            return result;
        },
        async count (uid, params = {}) {
            const states = await db.lifecycles.run('beforeCount', uid, {
                params
            });
            const res = await this.createQueryBuilder(uid).init(_.pick([
                '_q',
                'where',
                'filters'
            ], params)).count().first().execute();
            const result = Number(res.count);
            await db.lifecycles.run('afterCount', uid, {
                params,
                result
            }, states);
            return result;
        },
        async create (uid, params = {}) {
            const states = await db.lifecycles.run('beforeCreate', uid, {
                params
            });
            const metadata = db.metadata.get(uid);
            const { data } = params;
            if (!_.isPlainObject(data)) {
                throw new Error('Create expects a data object');
            }
            const dataToInsert = processData(metadata, data, {
                withDefaults: true
            });
            const res = await this.createQueryBuilder(uid).insert(dataToInsert).execute();
            const id = isRecord(res[0]) ? res[0].id : res[0];
            const trx = await strapi.db.transaction();
            try {
                await this.attachRelations(uid, id, data, {
                    transaction: trx.get()
                });
                await trx.commit();
            } catch (e) {
                await trx.rollback();
                await this.createQueryBuilder(uid).where({
                    id
                }).delete().execute();
                throw e;
            }
            // TODO: in case there is no select or populate specified return the inserted data ?
            // TODO: do not trigger the findOne lifecycles ?
            const result = await this.findOne(uid, {
                where: {
                    id
                },
                select: params.select,
                populate: params.populate,
                filters: params.filters
            });
            await db.lifecycles.run('afterCreate', uid, {
                params,
                result
            }, states);
            return result;
        },
        // TODO: where do we handle relation processing for many queries ?
        async createMany (uid, params = {}) {
            const states = await db.lifecycles.run('beforeCreateMany', uid, {
                params
            });
            const metadata = db.metadata.get(uid);
            const { data } = params;
            if (!_.isArray(data)) {
                throw new Error('CreateMany expects data to be an array');
            }
            const dataToInsert = data.map((datum)=>processData(metadata, datum, {
                    withDefaults: true
                }));
            if (_.isEmpty(dataToInsert)) {
                throw new Error('Nothing to insert');
            }
            const createdEntries = await this.createQueryBuilder(uid).insert(dataToInsert).execute();
            const result = {
                count: data.length,
                ids: createdEntries.map((entry)=>typeof entry === 'object' ? entry?.id : entry)
            };
            await db.lifecycles.run('afterCreateMany', uid, {
                params,
                result
            }, states);
            return result;
        },
        async update (uid, params = {}) {
            const states = await db.lifecycles.run('beforeUpdate', uid, {
                params
            });
            const metadata = db.metadata.get(uid);
            const { where, data } = params;
            if (!_.isPlainObject(data)) {
                throw new Error('Update requires a data object');
            }
            if (_.isEmpty(where)) {
                throw new Error('Update requires a where parameter');
            }
            const entity = await this.createQueryBuilder(uid).select('*').where(where).first().execute({
                mapResults: false
            });
            if (!entity) {
                return null;
            }
            const { id } = entity;
            const dataToUpdate = processData(metadata, data);
            if (!_.isEmpty(dataToUpdate)) {
                await this.createQueryBuilder(uid).where({
                    id
                }).update(dataToUpdate).execute();
            }
            const trx = await strapi.db.transaction();
            try {
                await this.updateRelations(uid, id, data, {
                    transaction: trx.get()
                });
                await trx.commit();
            } catch (e) {
                await trx.rollback();
                await this.createQueryBuilder(uid).where({
                    id
                }).update(entity).execute();
                throw e;
            }
            // TODO: do not trigger the findOne lifecycles ?
            const result = await this.findOne(uid, {
                where: {
                    id
                },
                select: params.select,
                populate: params.populate,
                filters: params.filters
            });
            await db.lifecycles.run('afterUpdate', uid, {
                params,
                result
            }, states);
            return result;
        },
        // TODO: where do we handle relation processing for many queries ?
        async updateMany (uid, params = {}) {
            const states = await db.lifecycles.run('beforeUpdateMany', uid, {
                params
            });
            const metadata = db.metadata.get(uid);
            const { where, data } = params;
            const dataToUpdate = processData(metadata, data);
            if (_.isEmpty(dataToUpdate)) {
                throw new Error('Update requires data');
            }
            const updatedRows = await this.createQueryBuilder(uid).where(where).update(dataToUpdate).execute();
            const result = {
                count: updatedRows
            };
            await db.lifecycles.run('afterUpdateMany', uid, {
                params,
                result
            }, states);
            return result;
        },
        async delete (uid, params = {}) {
            const states = await db.lifecycles.run('beforeDelete', uid, {
                params
            });
            const { where, select, populate } = params;
            if (_.isEmpty(where)) {
                throw new Error('Delete requires a where parameter');
            }
            // TODO: do not trigger the findOne lifecycles ?
            const entity = await this.findOne(uid, {
                select: select && [
                    'id'
                ].concat(select),
                where,
                populate
            });
            if (!entity) {
                return null;
            }
            const { id } = entity;
            await this.createQueryBuilder(uid).where({
                id
            }).delete().execute();
            const trx = await strapi.db.transaction();
            try {
                await this.deleteRelations(uid, id, {
                    transaction: trx.get()
                });
                await trx.commit();
            } catch (e) {
                await trx.rollback();
                throw e;
            }
            await db.lifecycles.run('afterDelete', uid, {
                params,
                result: entity
            }, states);
            return entity;
        },
        // TODO: where do we handle relation processing for many queries ?
        async deleteMany (uid, params = {}) {
            const states = await db.lifecycles.run('beforeDeleteMany', uid, {
                params
            });
            const { where } = params;
            const deletedRows = await this.createQueryBuilder(uid).where(where).delete().execute({
                mapResults: false
            });
            const result = {
                count: deletedRows
            };
            await db.lifecycles.run('afterDeleteMany', uid, {
                params,
                result
            }, states);
            return result;
        },
        /**
     * Attach relations to a new entity
     */ async attachRelations (uid, id, data, options) {
            const { attributes } = db.metadata.get(uid);
            const { transaction: trx } = options ?? {};
            for (const attributeName of Object.keys(attributes)){
                const attribute = attributes[attributeName];
                const isValidLink = _.has(attributeName, data) && !_.isNil(data[attributeName]);
                if (attribute.type !== 'relation' || !isValidLink) {
                    continue;
                }
                const cleanRelationData = toAssocs(data[attributeName]);
                if (attribute.relation === 'morphOne' || attribute.relation === 'morphMany') {
                    /**
           * morphOne and morphMany relations
           */ const { target, morphBy } = attribute;
                    const targetAttribute = db.metadata.get(target).attributes[morphBy];
                    if (targetAttribute.type !== 'relation') {
                        throw new Error(`Expected target attribute ${target}.${morphBy} to be a relation attribute`);
                    }
                    if (targetAttribute.relation === 'morphToOne') {
                        // set columns
                        const { idColumn, typeColumn } = targetAttribute.morphColumn;
                        const relId = toId(cleanRelationData.set?.[0]);
                        await this.createQueryBuilder(target).update({
                            [idColumn.name]: id,
                            [typeColumn.name]: uid
                        }).where({
                            id: relId
                        }).transacting(trx).execute();
                    } else if (targetAttribute.relation === 'morphToMany') {
                        const { joinTable } = targetAttribute;
                        const { joinColumn, morphColumn } = joinTable;
                        const { idColumn, typeColumn } = morphColumn;
                        if (_.isEmpty(cleanRelationData.set)) {
                            continue;
                        }
                        const rows = cleanRelationData.set?.map((data, idx)=>{
                            return {
                                [joinColumn.name]: data.id,
                                [idColumn.name]: id,
                                [typeColumn.name]: uid,
                                ...'on' in joinTable && joinTable.on || {},
                                ...data.__pivot || {},
                                order: idx + 1,
                                field: attributeName
                            };
                        }) ?? [];
                        await this.createQueryBuilder(joinTable.name).insert(rows).transacting(trx).execute();
                    }
                    continue;
                } else if (attribute.relation === 'morphToOne') {
                    continue;
                } else if (attribute.relation === 'morphToMany') {
                    /**
           * morphToMany
           */ const { joinTable } = attribute;
                    const { joinColumn, morphColumn } = joinTable;
                    const { idColumn, typeColumn, typeField = '__type' } = morphColumn;
                    if (_.isEmpty(cleanRelationData.set) && _.isEmpty(cleanRelationData.connect)) {
                        continue;
                    }
                    // set happens before connect/disconnect
                    const dataset = cleanRelationData.set || cleanRelationData.connect || [];
                    const rows = dataset.map((data, idx)=>({
                            [joinColumn.name]: id,
                            [idColumn.name]: data.id,
                            [typeColumn.name]: data[typeField],
                            ...'on' in joinTable && joinTable.on || {},
                            ...data.__pivot || {},
                            order: idx + 1
                        }));
                    const orderMap = relationsOrderer.relationsOrderer([], morphColumn.idColumn.name, 'order', true // Always make a strict connect when inserting
                    ).connect(// Merge id & __type to get a single id key
                    dataset.map(morphRelations.encodePolymorphicRelation({
                        idColumn: 'id',
                        typeColumn: typeField
                    }))).get()// set the order based on the order of the ids
                    .reduce((acc, rel, idx)=>({
                            ...acc,
                            [rel.id]: idx + 1
                        }), {});
                    rows.forEach((row)=>{
                        const rowId = row[morphColumn.idColumn.name];
                        const rowType = row[morphColumn.typeColumn.name];
                        const encodedId = morphRelations.encodePolymorphicId(rowId, rowType);
                        row.order = orderMap[encodedId];
                    });
                    // delete previous relations
                    await morphRelations.deleteRelatedMorphOneRelationsAfterMorphToManyUpdate(rows, {
                        uid,
                        attributeName,
                        joinTable,
                        db,
                        transaction: trx
                    });
                    await this.createQueryBuilder(joinTable.name).insert(rows).transacting(trx).execute();
                    continue;
                }
                if ('joinColumn' in attribute && attribute.joinColumn && attribute.owner) {
                    const relIdsToAdd = toIds(cleanRelationData.set);
                    if (attribute.relation === 'oneToOne' && relations.isBidirectional(attribute) && relIdsToAdd.length) {
                        await this.createQueryBuilder(uid).where({
                            [attribute.joinColumn.name]: relIdsToAdd,
                            id: {
                                $ne: id
                            }
                        }).update({
                            [attribute.joinColumn.name]: null
                        }).transacting(trx).execute();
                    }
                    continue;
                }
                // oneToOne oneToMany on the non owning side
                if ('joinColumn' in attribute && attribute.joinColumn && !attribute.owner) {
                    // need to set the column on the target
                    const { target } = attribute;
                    // TODO: check it is an id & the entity exists (will throw due to FKs otherwise so not a big pbl in SQL)
                    const relIdsToAdd = toIds(cleanRelationData.set);
                    await this.createQueryBuilder(target).where({
                        [attribute.joinColumn.referencedColumn]: id
                    }).update({
                        [attribute.joinColumn.referencedColumn]: null
                    }).transacting(trx).execute();
                    await this.createQueryBuilder(target).update({
                        [attribute.joinColumn.referencedColumn]: id
                    })// NOTE: works if it is an array or a single id
                    .where({
                        id: relIdsToAdd
                    }).transacting(trx).execute();
                }
                if ('joinTable' in attribute && attribute.joinTable) {
                    // need to set the column on the target
                    const { joinTable } = attribute;
                    const { joinColumn, inverseJoinColumn, orderColumnName, inverseOrderColumnName } = joinTable;
                    const relsToAdd = (cleanRelationData.set || cleanRelationData.connect) ?? [];
                    const relIdsToadd = toIds(relsToAdd);
                    if (relations.isBidirectional(attribute) && relations.isOneToAny(attribute)) {
                        await regularRelations.deletePreviousOneToAnyRelations({
                            id,
                            attribute,
                            relIdsToadd,
                            db,
                            transaction: trx
                        });
                    }
                    // prepare new relations to insert
                    const insert = _.uniqBy('id', relsToAdd).map((data)=>{
                        return {
                            [joinColumn.name]: id,
                            [inverseJoinColumn.name]: data.id,
                            ...'on' in joinTable && joinTable.on || {},
                            ...data.__pivot || {}
                        };
                    });
                    // add order value
                    if (cleanRelationData.set && relations.hasOrderColumn(attribute)) {
                        insert.forEach((data, idx)=>{
                            data[orderColumnName] = idx + 1;
                        });
                    } else if (cleanRelationData.connect && relations.hasOrderColumn(attribute)) {
                        // use position attributes to calculate order
                        const orderMap = relationsOrderer.relationsOrderer([], inverseJoinColumn.name, joinTable.orderColumnName, true // Always make an strict connect when inserting
                        ).connect(relsToAdd).get()// set the order based on the order of the ids
                        .reduce((acc, rel, idx)=>({
                                ...acc,
                                [rel.id]: idx
                            }), {});
                        insert.forEach((row)=>{
                            row[orderColumnName] = orderMap[row[inverseJoinColumn.name]];
                        });
                    }
                    // add inv_order value
                    if (relations.hasInverseOrderColumn(attribute)) {
                        const maxResults = await db.getConnection().select(inverseJoinColumn.name).max(inverseOrderColumnName, {
                            as: 'max'
                        }).whereIn(inverseJoinColumn.name, relIdsToadd).where(joinTable.on || {}).groupBy(inverseJoinColumn.name).from(joinTable.name).transacting(trx);
                        const maxMap = maxResults.reduce((acc, res)=>Object.assign(acc, {
                                [res[inverseJoinColumn.name]]: res.max
                            }), {});
                        insert.forEach((rel)=>{
                            rel[inverseOrderColumnName] = (maxMap[rel[inverseJoinColumn.name]] || 0) + 1;
                        });
                    }
                    if (insert.length === 0) {
                        continue;
                    }
                    // insert new relations
                    await this.createQueryBuilder(joinTable.name).insert(insert).transacting(trx).execute();
                }
            }
        },
        /**
     * Updates relations of an existing entity
     */ // TODO: check relation exists (handled by FKs except for polymorphics)
        async updateRelations (uid, id, data, options) {
            const { attributes } = db.metadata.get(uid);
            const { transaction: trx } = options ?? {};
            for (const attributeName of Object.keys(attributes)){
                const attribute = attributes[attributeName];
                if (attribute.type !== 'relation' || !_.has(attributeName, data)) {
                    continue;
                }
                const cleanRelationData = toAssocs(data[attributeName]);
                if (attribute.relation === 'morphOne' || attribute.relation === 'morphMany') {
                    const { target, morphBy } = attribute;
                    const targetAttribute = db.metadata.get(target).attributes[morphBy];
                    if (targetAttribute.type === 'relation' && targetAttribute.relation === 'morphToOne') {
                        // set columns
                        const { idColumn, typeColumn } = targetAttribute.morphColumn;
                        // update instead of deleting because the relation is directly on the entity table
                        // and not in a join table
                        await this.createQueryBuilder(target).update({
                            [idColumn.name]: null,
                            [typeColumn.name]: null
                        }).where({
                            [idColumn.name]: id,
                            [typeColumn.name]: uid
                        }).transacting(trx).execute();
                        if (!_.isNull(cleanRelationData.set)) {
                            const relId = toIds(cleanRelationData.set?.[0]);
                            await this.createQueryBuilder(target).update({
                                [idColumn.name]: id,
                                [typeColumn.name]: uid
                            }).where({
                                id: relId
                            }).transacting(trx).execute();
                        }
                    } else if (targetAttribute.type === 'relation' && targetAttribute.relation === 'morphToMany') {
                        const { joinTable } = targetAttribute;
                        const { joinColumn, morphColumn } = joinTable;
                        const { idColumn, typeColumn } = morphColumn;
                        const hasSet = !_.isEmpty(cleanRelationData.set);
                        const hasConnect = !_.isEmpty(cleanRelationData.connect);
                        const hasDisconnect = !_.isEmpty(cleanRelationData.disconnect);
                        // for connect/disconnect without a set, only modify those relations
                        if (!hasSet && (hasConnect || hasDisconnect)) {
                            // delete disconnects and connects (to prevent duplicates when we add them later)
                            const idsToDelete = [
                                ...cleanRelationData.disconnect || [],
                                ...cleanRelationData.connect || []
                            ];
                            if (!_.isEmpty(idsToDelete)) {
                                const where = {
                                    $or: idsToDelete.map((item)=>{
                                        return {
                                            [idColumn.name]: id,
                                            [typeColumn.name]: uid,
                                            [joinColumn.name]: item.id,
                                            ...joinTable.on || {},
                                            field: attributeName
                                        };
                                    })
                                };
                                await this.createQueryBuilder(joinTable.name).delete().where(where).transacting(trx).execute();
                            }
                            // connect relations
                            if (hasConnect) {
                                // Query database to find the order of the last relation
                                const start = await this.createQueryBuilder(joinTable.name).where({
                                    [idColumn.name]: id,
                                    [typeColumn.name]: uid,
                                    ...joinTable.on || {},
                                    ...data.__pivot || {}
                                }).max('order').first().transacting(trx).execute();
                                const startOrder = start?.max || 0;
                                const rows = (cleanRelationData.connect ?? []).map((data, idx)=>({
                                        [joinColumn.name]: data.id,
                                        [idColumn.name]: id,
                                        [typeColumn.name]: uid,
                                        ...joinTable.on || {},
                                        ...data.__pivot || {},
                                        order: startOrder + idx + 1,
                                        field: attributeName
                                    }));
                                await this.createQueryBuilder(joinTable.name).insert(rows).transacting(trx).execute();
                            }
                            continue;
                        }
                        // delete all relations
                        await this.createQueryBuilder(joinTable.name).delete().where({
                            [idColumn.name]: id,
                            [typeColumn.name]: uid,
                            ...joinTable.on || {},
                            field: attributeName
                        }).transacting(trx).execute();
                        if (hasSet) {
                            const rows = (cleanRelationData.set ?? []).map((data, idx)=>({
                                    [joinColumn.name]: data.id,
                                    [idColumn.name]: id,
                                    [typeColumn.name]: uid,
                                    ...joinTable.on || {},
                                    ...data.__pivot || {},
                                    order: idx + 1,
                                    field: attributeName
                                }));
                            await this.createQueryBuilder(joinTable.name).insert(rows).transacting(trx).execute();
                        }
                    }
                    continue;
                }
                if (attribute.relation === 'morphToOne') {
                    continue;
                }
                if (attribute.relation === 'morphToMany') {
                    const { joinTable } = attribute;
                    const { joinColumn, morphColumn } = joinTable;
                    const { idColumn, typeColumn, typeField = '__type' } = morphColumn;
                    const hasSet = !_.isEmpty(cleanRelationData.set);
                    const hasConnect = !_.isEmpty(cleanRelationData.connect);
                    const hasDisconnect = !_.isEmpty(cleanRelationData.disconnect);
                    // for connect/disconnect without a set, only modify those relations
                    if (!hasSet && (hasConnect || hasDisconnect)) {
                        // delete disconnects and connects (to prevent duplicates when we add them later)
                        const idsToDelete = [
                            ...cleanRelationData.disconnect || [],
                            ...cleanRelationData.connect || []
                        ];
                        const rowsToDelete = [
                            ...(cleanRelationData.disconnect ?? []).map((data, idx)=>({
                                    [joinColumn.name]: id,
                                    [idColumn.name]: data.id,
                                    [typeColumn.name]: data[typeField],
                                    ...'on' in joinTable && joinTable.on || {},
                                    ...data.__pivot || {},
                                    order: idx + 1
                                })),
                            ...(cleanRelationData.connect ?? []).map((data, idx)=>({
                                    [joinColumn.name]: id,
                                    [idColumn.name]: data.id,
                                    // @ts-expect-error TODO
                                    [typeColumn.name]: data[typeField],
                                    ...'on' in joinTable && joinTable.on || {},
                                    ...data.__pivot || {},
                                    order: idx + 1
                                }))
                        ];
                        const adjacentRelations = await this.createQueryBuilder(joinTable.name).where({
                            $or: [
                                {
                                    [joinColumn.name]: id,
                                    [idColumn.name]: {
                                        $in: _.compact(cleanRelationData.connect?.map((r)=>r.position?.after || r.position?.before))
                                    }
                                },
                                {
                                    [joinColumn.name]: id,
                                    order: this.createQueryBuilder(joinTable.name).max('order').where({
                                        [joinColumn.name]: id
                                    }).where(joinTable.on || {}).transacting(trx).getKnexQuery()
                                }
                            ]
                        }).where(joinTable.on || {}).transacting(trx).execute();
                        if (!_.isEmpty(idsToDelete)) {
                            const where = {
                                $or: idsToDelete.map((item)=>{
                                    return {
                                        [idColumn.name]: item.id,
                                        [typeColumn.name]: item[typeField],
                                        [joinColumn.name]: id,
                                        ...joinTable.on || {}
                                    };
                                })
                            };
                            // delete previous relations
                            await this.createQueryBuilder(joinTable.name).delete().where(where).transacting(trx).execute();
                            await morphRelations.deleteRelatedMorphOneRelationsAfterMorphToManyUpdate(rowsToDelete, {
                                uid,
                                attributeName,
                                joinTable,
                                db,
                                transaction: trx
                            });
                        }
                        // connect relations
                        if (hasConnect) {
                            const dataset = cleanRelationData.connect || [];
                            const rows = dataset.map((data)=>({
                                    [joinColumn.name]: id,
                                    [idColumn.name]: data.id,
                                    [typeColumn.name]: data[typeField],
                                    ...joinTable.on || {},
                                    ...data.__pivot || {},
                                    field: attributeName
                                }));
                            const orderMap = relationsOrderer.relationsOrderer(// Merge id & __type to get a single id key
                            adjacentRelations.map(morphRelations.encodePolymorphicRelation({
                                idColumn: idColumn.name,
                                typeColumn: typeColumn.name
                            })), idColumn.name, 'order', cleanRelationData.options?.strict).connect(// Merge id & __type to get a single id key
                            dataset.map(morphRelations.encodePolymorphicRelation({
                                idColumn: 'id',
                                typeColumn: '__type'
                            }))).getOrderMap();
                            rows.forEach((row)=>{
                                const rowId = row[idColumn.name];
                                const rowType = row[typeColumn.name];
                                const encodedId = morphRelations.encodePolymorphicId(rowId, rowType);
                                row.order = orderMap[encodedId];
                            });
                            await this.createQueryBuilder(joinTable.name).insert(rows).transacting(trx).execute();
                        }
                        continue;
                    }
                    if (hasSet) {
                        // delete all relations for this entity
                        await this.createQueryBuilder(joinTable.name).delete().where({
                            [joinColumn.name]: id,
                            ...joinTable.on || {}
                        }).transacting(trx).execute();
                        const rows = (cleanRelationData.set ?? []).map((data, idx)=>({
                                [joinColumn.name]: id,
                                [idColumn.name]: data.id,
                                [typeColumn.name]: data[typeField],
                                field: attributeName,
                                ...joinTable.on || {},
                                ...data.__pivot || {},
                                order: idx + 1
                            }));
                        await morphRelations.deleteRelatedMorphOneRelationsAfterMorphToManyUpdate(rows, {
                            uid,
                            attributeName,
                            joinTable,
                            db,
                            transaction: trx
                        });
                        await this.createQueryBuilder(joinTable.name).insert(rows).transacting(trx).execute();
                    }
                    continue;
                }
                if ('joinColumn' in attribute && attribute.joinColumn && attribute.owner) {
                    continue;
                }
                // oneToOne oneToMany on the non owning side.
                // Since it is a join column no need to remove previous relations
                if ('joinColumn' in attribute && attribute.joinColumn && !attribute.owner) {
                    // need to set the column on the target
                    const { target } = attribute;
                    await this.createQueryBuilder(target).where({
                        [attribute.joinColumn.referencedColumn]: id
                    }).update({
                        [attribute.joinColumn.referencedColumn]: null
                    }).transacting(trx).execute();
                    if (!_.isNull(cleanRelationData.set)) {
                        const relIdsToAdd = toIds(cleanRelationData.set);
                        await this.createQueryBuilder(target).where({
                            id: relIdsToAdd
                        }).update({
                            [attribute.joinColumn.referencedColumn]: id
                        }).transacting(trx).execute();
                    }
                }
                if (attribute.joinTable) {
                    const { joinTable } = attribute;
                    const { joinColumn, inverseJoinColumn, orderColumnName, inverseOrderColumnName } = joinTable;
                    const select = [
                        joinColumn.name,
                        inverseJoinColumn.name
                    ];
                    if (relations.hasOrderColumn(attribute)) {
                        select.push(orderColumnName);
                    }
                    if (relations.hasInverseOrderColumn(attribute)) {
                        select.push(inverseOrderColumnName);
                    }
                    // only delete relations
                    if (_.isNull(cleanRelationData.set)) {
                        await regularRelations.deleteRelations({
                            id,
                            attribute,
                            db,
                            relIdsToDelete: 'all',
                            transaction: trx
                        });
                    } else {
                        const isPartialUpdate = !_.has('set', cleanRelationData);
                        let relIdsToaddOrMove;
                        if (isPartialUpdate) {
                            if (relations.isAnyToOne(attribute)) ;
                            relIdsToaddOrMove = toIds(cleanRelationData.connect);
                            const relIdsToDelete = toIds(_.differenceWith(_.isEqual, cleanRelationData.disconnect, cleanRelationData.connect ?? []));
                            if (!_.isEmpty(relIdsToDelete)) {
                                await regularRelations.deleteRelations({
                                    id,
                                    attribute,
                                    db,
                                    relIdsToDelete,
                                    transaction: trx
                                });
                            }
                            if (_.isEmpty(cleanRelationData.connect)) {
                                continue;
                            }
                            // Fetch current relations to handle ordering
                            let currentMovingRels = [];
                            if (relations.hasOrderColumn(attribute) || relations.hasInverseOrderColumn(attribute)) {
                                currentMovingRels = await this.createQueryBuilder(joinTable.name).select(select).where({
                                    [joinColumn.name]: id,
                                    [inverseJoinColumn.name]: {
                                        $in: relIdsToaddOrMove
                                    }
                                }).where(joinTable.on || {}).transacting(trx).execute();
                            }
                            // prepare relations to insert
                            const insert = _.uniqBy('id', cleanRelationData.connect).map((relToAdd)=>({
                                    [joinColumn.name]: id,
                                    [inverseJoinColumn.name]: relToAdd.id,
                                    ...joinTable.on || {},
                                    ...relToAdd.__pivot || {}
                                }));
                            if (relations.hasOrderColumn(attribute)) {
                                // Get all adjacent relations and the one with the highest order
                                const adjacentRelations = await this.createQueryBuilder(joinTable.name).where({
                                    $or: [
                                        {
                                            [joinColumn.name]: id,
                                            [inverseJoinColumn.name]: {
                                                $in: _.compact(cleanRelationData.connect?.map((r)=>r.position?.after || r.position?.before))
                                            }
                                        },
                                        {
                                            [joinColumn.name]: id,
                                            [orderColumnName]: this.createQueryBuilder(joinTable.name).max(orderColumnName).where({
                                                [joinColumn.name]: id
                                            }).where(joinTable.on || {}).transacting(trx).getKnexQuery()
                                        }
                                    ]
                                }).where(joinTable.on || {}).transacting(trx).execute();
                                const orderMap = relationsOrderer.relationsOrderer(adjacentRelations, inverseJoinColumn.name, joinTable.orderColumnName, cleanRelationData.options?.strict).connect(cleanRelationData.connect ?? []).getOrderMap();
                                insert.forEach((row)=>{
                                    row[orderColumnName] = orderMap[row[inverseJoinColumn.name]];
                                });
                            }
                            // add inv order value
                            if (relations.hasInverseOrderColumn(attribute)) {
                                const nonExistingRelsIds = _.difference(relIdsToaddOrMove, _.map(inverseJoinColumn.name, currentMovingRels));
                                const maxResults = await db.getConnection().select(inverseJoinColumn.name).max(inverseOrderColumnName, {
                                    as: 'max'
                                }).whereIn(inverseJoinColumn.name, nonExistingRelsIds).where(joinTable.on || {}).groupBy(inverseJoinColumn.name).from(joinTable.name).transacting(trx);
                                const maxMap = maxResults.reduce((acc, res)=>Object.assign(acc, {
                                        [res[inverseJoinColumn.name]]: res.max
                                    }), {});
                                insert.forEach((row)=>{
                                    row[inverseOrderColumnName] = (maxMap[row[inverseJoinColumn.name]] || 0) + 1;
                                });
                            }
                            // insert rows
                            const query = this.createQueryBuilder(joinTable.name).insert(insert).onConflict(joinTable.pivotColumns).transacting(trx);
                            if (relations.hasOrderColumn(attribute)) {
                                query.merge([
                                    orderColumnName
                                ]);
                            } else {
                                query.ignore();
                            }
                            await query.execute();
                            // remove gap between orders
                            await regularRelations.cleanOrderColumns({
                                attribute,
                                db,
                                id,
                                transaction: trx
                            });
                        } else {
                            if (relations.isAnyToOne(attribute)) {
                                cleanRelationData.set = cleanRelationData.set?.slice(-1);
                            }
                            // overwrite all relations
                            relIdsToaddOrMove = toIds(cleanRelationData.set);
                            await regularRelations.deleteRelations({
                                id,
                                attribute,
                                db,
                                relIdsToDelete: 'all',
                                relIdsToNotDelete: relIdsToaddOrMove,
                                transaction: trx
                            });
                            if (_.isEmpty(cleanRelationData.set)) {
                                continue;
                            }
                            const insert = _.uniqBy('id', cleanRelationData.set).map((relToAdd)=>({
                                    [joinColumn.name]: id,
                                    [inverseJoinColumn.name]: relToAdd.id,
                                    ...joinTable.on || {},
                                    ...relToAdd.__pivot || {}
                                }));
                            // add order value
                            if (relations.hasOrderColumn(attribute)) {
                                insert.forEach((row, idx)=>{
                                    row[orderColumnName] = idx + 1;
                                });
                            }
                            // add inv order value
                            if (relations.hasInverseOrderColumn(attribute)) {
                                const existingRels = await this.createQueryBuilder(joinTable.name).select(inverseJoinColumn.name).where({
                                    [joinColumn.name]: id,
                                    [inverseJoinColumn.name]: {
                                        $in: relIdsToaddOrMove
                                    }
                                }).where(joinTable.on || {}).transacting(trx).execute();
                                const inverseRelsIds = _.map(inverseJoinColumn.name, existingRels);
                                const nonExistingRelsIds = _.difference(relIdsToaddOrMove, inverseRelsIds);
                                const maxResults = await db.getConnection().select(inverseJoinColumn.name).max(inverseOrderColumnName, {
                                    as: 'max'
                                }).whereIn(inverseJoinColumn.name, nonExistingRelsIds).where(joinTable.on || {}).groupBy(inverseJoinColumn.name).from(joinTable.name).transacting(trx);
                                const maxMap = maxResults.reduce((acc, res)=>Object.assign(acc, {
                                        [res[inverseJoinColumn.name]]: res.max
                                    }), {});
                                insert.forEach((row)=>{
                                    row[inverseOrderColumnName] = (maxMap[row[inverseJoinColumn.name]] || 0) + 1;
                                });
                            }
                            // insert rows
                            const query = this.createQueryBuilder(joinTable.name).insert(insert).onConflict(joinTable.pivotColumns).transacting(trx);
                            if (relations.hasOrderColumn(attribute)) {
                                query.merge([
                                    orderColumnName
                                ]);
                            } else {
                                query.ignore();
                            }
                            await query.execute();
                        }
                        // Delete the previous relations for oneToAny relations
                        if (relations.isBidirectional(attribute) && relations.isOneToAny(attribute)) {
                            await regularRelations.deletePreviousOneToAnyRelations({
                                id,
                                attribute,
                                relIdsToadd: relIdsToaddOrMove,
                                db,
                                transaction: trx
                            });
                        }
                        // Delete the previous relations for anyToOne relations
                        if (relations.isAnyToOne(attribute)) {
                            await regularRelations.deletePreviousAnyToOneRelations({
                                id,
                                attribute,
                                relIdToadd: relIdsToaddOrMove[0],
                                db,
                                transaction: trx
                            });
                        }
                    }
                }
            }
        },
        /**
     * Delete relational associations of an existing entity
     * This removes associations but doesn't do cascade deletions for components for example. This will be handled on the entity service layer instead
     * NOTE: Most of the deletion should be handled by ON DELETE CASCADE for dialects that have FKs
     *
     * @param {EntityManager} em - entity manager instance
     * @param {Metadata} metadata - model metadta
     * @param {ID} id - entity ID
     */ async deleteRelations (uid, id, options) {
            const { attributes } = db.metadata.get(uid);
            const { transaction: trx } = options ?? {};
            for (const attributeName of Object.keys(attributes)){
                const attribute = attributes[attributeName];
                if (attribute.type !== 'relation') {
                    continue;
                }
                /*
          if morphOne | morphMany
            if morphBy is morphToOne
              set null
            if morphBy is morphToOne
              delete links
        */ if (attribute.relation === 'morphOne' || attribute.relation === 'morphMany') {
                    const { target, morphBy } = attribute;
                    const targetAttribute = db.metadata.get(target).attributes[morphBy];
                    if (targetAttribute.type === 'relation' && targetAttribute.relation === 'morphToOne') {
                        // set columns
                        const { idColumn, typeColumn } = targetAttribute.morphColumn;
                        await this.createQueryBuilder(target).update({
                            [idColumn.name]: null,
                            [typeColumn.name]: null
                        }).where({
                            [idColumn.name]: id,
                            [typeColumn.name]: uid
                        }).transacting(trx).execute();
                    } else if (targetAttribute.type === 'relation' && targetAttribute.relation === 'morphToMany') {
                        const { joinTable } = targetAttribute;
                        const { morphColumn } = joinTable;
                        const { idColumn, typeColumn } = morphColumn;
                        await this.createQueryBuilder(joinTable.name).delete().where({
                            [idColumn.name]: id,
                            [typeColumn.name]: uid,
                            ...joinTable.on || {},
                            field: attributeName
                        }).transacting(trx).execute();
                    }
                    continue;
                }
                /*
          if morphToOne
            nothing to do
        */ if (attribute.relation === 'morphToOne') ;
                /*
            if morphToMany
            delete links
        */ if (attribute.relation === 'morphToMany') {
                    const { joinTable } = attribute;
                    const { joinColumn } = joinTable;
                    await this.createQueryBuilder(joinTable.name).delete().where({
                        [joinColumn.name]: id,
                        ...joinTable.on || {}
                    }).transacting(trx).execute();
                    continue;
                }
                // do not need to delete links when using foreign keys
                if (db.dialect.usesForeignKeys()) {
                    return;
                }
                // NOTE: we do not remove existing associations with the target as it should handled by unique FKs instead
                if ('joinColumn' in attribute && attribute.joinColumn && attribute.owner) {
                    continue;
                }
                // oneToOne oneToMany on the non owning side.
                if ('joinColumn' in attribute && attribute.joinColumn && !attribute.owner) {
                    // need to set the column on the target
                    const { target } = attribute;
                    await this.createQueryBuilder(target).where({
                        [attribute.joinColumn.referencedColumn]: id
                    }).update({
                        [attribute.joinColumn.referencedColumn]: null
                    }).transacting(trx).execute();
                }
                if ('joinTable' in attribute && attribute.joinTable) {
                    await regularRelations.deleteRelations({
                        id,
                        attribute,
                        db,
                        relIdsToDelete: 'all',
                        transaction: trx
                    });
                }
            }
        },
        // TODO: add lifecycle events
        async populate (uid, entity, populate) {
            const entry = await this.findOne(uid, {
                select: [
                    'id'
                ],
                where: {
                    id: entity.id
                },
                populate
            });
            return {
                ...entity,
                ...entry
            };
        },
        // TODO: add lifecycle events
        async load (uid, entity, fields, populate) {
            const { attributes } = db.metadata.get(uid);
            const fieldsArr = _.castArray(fields);
            fieldsArr.forEach((field)=>{
                const attribute = attributes[field];
                if (!attribute || attribute.type !== 'relation') {
                    throw new Error(`Invalid load. Expected ${field} to be a relational attribute`);
                }
            });
            const entry = await this.findOne(uid, {
                select: [
                    'id'
                ],
                where: {
                    id: entity.id
                },
                populate: fieldsArr.reduce((acc, field)=>{
                    acc[field] = populate || true;
                    return acc;
                }, {})
            });
            if (!entry) {
                return null;
            }
            if (Array.isArray(fields)) {
                return _.pick(fields, entry);
            }
            return entry[fields];
        },
        // cascading
        // aggregations
        // -> avg
        // -> min
        // -> max
        // -> grouping
        // formulas
        // custom queries
        // utilities
        // -> map result
        // -> map input
        // extra features
        // -> virtuals
        // -> private
        createQueryBuilder (uid) {
            return queryBuilder(uid, db);
        },
        getRepository (uid) {
            if (!repoMap[uid]) {
                repoMap[uid] = entityRepository.createRepository(uid, db);
            }
            return repoMap[uid];
        }
    };
};

exports.createEntityManager = createEntityManager;
//# sourceMappingURL=index.js.map
