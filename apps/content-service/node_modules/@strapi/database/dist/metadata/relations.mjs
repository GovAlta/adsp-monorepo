import _, { snakeCase } from 'lodash/fp';
import { identifiers } from '../utils/identifiers/index.mjs';

const ID = identifiers.ID_COLUMN;
const ORDER = identifiers.ORDER_COLUMN;
const FIELD = identifiers.FIELD_COLUMN;
const hasInversedBy = (attr)=>'inversedBy' in attr;
const hasMappedBy = (attr)=>'mappedBy' in attr;
const isOneToAny = (attribute)=>[
        'oneToOne',
        'oneToMany'
    ].includes(attribute.relation);
const isManyToAny = (attribute)=>[
        'manyToMany',
        'manyToOne'
    ].includes(attribute.relation);
const isAnyToOne = (attribute)=>[
        'oneToOne',
        'manyToOne'
    ].includes(attribute.relation);
const isAnyToMany = (attribute)=>[
        'oneToMany',
        'manyToMany'
    ].includes(attribute.relation);
const isBidirectional = (attribute)=>hasInversedBy(attribute) || hasMappedBy(attribute);
const isOwner = (attribute)=>!isBidirectional(attribute) || hasInversedBy(attribute);
const shouldUseJoinTable = (attribute)=>!('useJoinTable' in attribute) || attribute.useJoinTable !== false;
const hasOrderColumn = (attribute)=>isAnyToMany(attribute);
const hasInverseOrderColumn = (attribute)=>isBidirectional(attribute) && isManyToAny(attribute);
/**
 * Creates a oneToOne relation metadata
 *
 * if owner then
 *   if with join table then
 *     create join table
 *   else
 *     create joinColumn
 *   if bidirectional then
 *     set inverse attribute joinCol or joinTable info correctly
 * else
 *   this property must be set by the owner side
 *   verify the owner side is valid // should be done before or at the same time ?
 */ const createOneToOne = (attributeName, attribute, meta, metadata)=>{
    if (isOwner(attribute)) {
        if (shouldUseJoinTable(attribute)) {
            createJoinTable(metadata, {
                attribute,
                attributeName,
                meta
            });
        } else {
            createJoinColumn(metadata, {
                attribute,
                attributeName,
                meta
            });
        }
    }
};
/**
 * Creates a oneToMany relation metadata
 *
 * if unidirectional then
 *   create join table
 * if bidirectional then
 *   cannot be owning side
 *   do nothing
 */ const createOneToMany = (attributeName, attribute, meta, metadata)=>{
    if (shouldUseJoinTable(attribute) && !isBidirectional(attribute)) {
        createJoinTable(metadata, {
            attribute,
            attributeName,
            meta
        });
    } else if (isOwner(attribute)) {
        throw new Error('one side of a oneToMany cannot be the owner side in a bidirectional relation');
    }
};
/**
 * Creates a manyToOne relation metadata
 *
 * if unidirectional then
 *   if with join table then
 *     create join table
 *   else
 *     create join column
 * else
 *   must be the owner side
 *   if with join table then
 *     create join table
 *   else
 *     create join column
 *   set inverse attribute joinCol or joinTable info correctly
 */ const createManyToOne = (attributeName, attribute, meta, metadata)=>{
    if (isBidirectional(attribute) && !isOwner(attribute)) {
        throw new Error('The many side of a manyToOne must be the owning side');
    }
    if (shouldUseJoinTable(attribute)) {
        createJoinTable(metadata, {
            attribute,
            attributeName,
            meta
        });
    } else {
        createJoinColumn(metadata, {
            attribute,
            attributeName,
            meta
        });
    }
};
/**
 * Creates a manyToMany relation metadata
 *
 * if unidirectional
 *   create join table
 * else
 *   if owner then
 *     if with join table then
 *       create join table
 *   else
 *     do nothing
 */ const createManyToMany = (attributeName, attribute, meta, metadata)=>{
    if (shouldUseJoinTable(attribute) && (!isBidirectional(attribute) || isOwner(attribute))) {
        createJoinTable(metadata, {
            attribute,
            attributeName,
            meta
        });
    }
};
/**
 * Creates a morphToOne relation metadata
 *
 * if with join table then
 *   create join table
 * else
 *  create join columnsa
 *
 * if bidirectionnal
 *  set info in the traget
 */ const createMorphToOne = (attributeName, attribute)=>{
    const idColumnName = identifiers.getJoinColumnAttributeIdName('target');
    const typeColumnName = identifiers.getMorphColumnTypeName('target');
    Object.assign(attribute, {
        owner: true,
        morphColumn: attribute.morphColumn ?? {
            typeColumn: {
                name: typeColumnName
            },
            idColumn: {
                name: idColumnName,
                referencedColumn: ID
            }
        }
    });
};
/**
 * Creates a morphToMany relation metadata
 */ const createMorphToMany = (attributeName, attribute, meta, metadata)=>{
    if ('joinTable' in attribute && attribute.joinTable && !attribute.joinTable.__internal__) {
        return;
    }
    const joinTableName = identifiers.getMorphTableName(meta.tableName, attributeName);
    const joinColumnName = identifiers.getMorphColumnJoinTableIdName(snakeCase(meta.singularName));
    const idColumnName = identifiers.getMorphColumnAttributeIdName(attributeName);
    const typeColumnName = identifiers.getMorphColumnTypeName(attributeName);
    const fkIndexName = identifiers.getFkIndexName(joinTableName);
    metadata.add({
        singularName: joinTableName,
        uid: joinTableName,
        tableName: joinTableName,
        attributes: {
            [ID]: {
                type: 'increments'
            },
            [joinColumnName]: {
                type: 'integer',
                column: {
                    unsigned: true
                },
                // This must be set explicitly so that it is used instead of shortening the attribute name, which is already shortened
                columnName: joinColumnName
            },
            [idColumnName]: {
                type: 'integer',
                column: {
                    unsigned: true
                }
            },
            [typeColumnName]: {
                type: 'string'
            },
            [FIELD]: {
                type: 'string'
            },
            [ORDER]: {
                type: 'float',
                column: {
                    unsigned: true
                }
            }
        },
        indexes: [
            {
                name: fkIndexName,
                columns: [
                    joinColumnName
                ]
            },
            {
                name: identifiers.getOrderIndexName(joinTableName),
                columns: [
                    ORDER
                ]
            },
            {
                name: identifiers.getIdColumnIndexName(joinTableName),
                columns: [
                    idColumnName
                ]
            }
        ],
        foreignKeys: [
            {
                name: fkIndexName,
                columns: [
                    joinColumnName
                ],
                referencedColumns: [
                    ID
                ],
                referencedTable: meta.tableName,
                onDelete: 'CASCADE'
            }
        ],
        lifecycles: {},
        columnToAttribute: {}
    });
    const joinTable = {
        __internal__: true,
        name: joinTableName,
        joinColumn: {
            name: joinColumnName,
            referencedColumn: ID
        },
        morphColumn: {
            typeColumn: {
                name: typeColumnName
            },
            idColumn: {
                name: idColumnName,
                referencedColumn: ID
            }
        },
        orderBy: {
            order: 'asc'
        },
        pivotColumns: [
            joinColumnName,
            typeColumnName,
            idColumnName
        ]
    };
    attribute.joinTable = joinTable;
};
/**
 * Creates a morphOne relation metadata
 */ const createMorphOne = (attributeName, attribute, meta, metadata)=>{
    const targetMeta = metadata.get(attribute.target);
    if (!targetMeta) {
        throw new Error(`Morph target not found. Looking for ${attribute.target}`);
    }
    if (attribute.morphBy && !_.has(attribute.morphBy, targetMeta.attributes)) {
        throw new Error(`Morph target attribute not found. Looking for ${attribute.morphBy}`);
    }
};
/**
 * Creates a morphMany relation metadata
 */ const createMorphMany = (attributeName, attribute, meta, metadata)=>{
    const targetMeta = metadata.get(attribute.target);
    if (!targetMeta) {
        throw new Error(`Morph target not found. Looking for ${attribute.target}`);
    }
    if (attribute.morphBy && !_.has(attribute.morphBy, targetMeta.attributes)) {
        throw new Error(`Morph target attribute not found. Looking for ${attribute.morphBy}`);
    }
};
/**
 * Creates a join column info and add them to the attribute meta
 */ const createJoinColumn = (metadata, { attribute, attributeName })=>{
    const targetMeta = metadata.get(attribute.target);
    if (!targetMeta) {
        throw new Error(`Unknown target ${attribute.target}`);
    }
    const joinColumnName = identifiers.getJoinColumnAttributeIdName(snakeCase(attributeName));
    const joinColumn = {
        name: joinColumnName,
        referencedColumn: ID,
        referencedTable: targetMeta.tableName
    };
    if ('joinColumn' in attribute) {
        Object.assign(joinColumn, attribute.joinColumn);
    }
    Object.assign(attribute, {
        owner: true,
        joinColumn
    });
    if (isBidirectional(attribute)) {
        const inverseAttribute = targetMeta.attributes[attribute.inversedBy];
        Object.assign(inverseAttribute, {
            joinColumn: {
                name: joinColumn.referencedColumn,
                referencedColumn: joinColumnName
            }
        });
    }
};
/**
 * Creates a join table and add it to the attribute meta
 */ const createJoinTable = (metadata, { attributeName, attribute, meta })=>{
    if (!shouldUseJoinTable(attribute)) {
        throw new Error('Attempted to create join table when useJoinTable is false');
    }
    const targetMeta = metadata.get(attribute.target);
    if (!targetMeta) {
        throw new Error(`Unknown target ${attribute.target}`);
    }
    // TODO: implement overwrite logic instead
    if ('joinTable' in attribute && attribute.joinTable && !attribute.joinTable.__internal__) {
        return;
    }
    const joinTableName = identifiers.getJoinTableName(snakeCase(meta.tableName), snakeCase(attributeName));
    const joinColumnName = identifiers.getJoinColumnAttributeIdName(snakeCase(meta.singularName));
    let inverseJoinColumnName = identifiers.getJoinColumnAttributeIdName(snakeCase(targetMeta.singularName));
    // if relation is self referencing
    if (joinColumnName === inverseJoinColumnName) {
        inverseJoinColumnName = identifiers.getInverseJoinColumnAttributeIdName(snakeCase(targetMeta.singularName));
    }
    const orderColumnName = identifiers.getOrderColumnName(snakeCase(targetMeta.singularName));
    // TODO: should this plus the conditional below be rolled into one method?
    let inverseOrderColumnName = identifiers.getOrderColumnName(snakeCase(meta.singularName));
    // if relation is self referencing
    if (attribute.relation === 'manyToMany' && orderColumnName === inverseOrderColumnName) {
        inverseOrderColumnName = identifiers.getInverseOrderColumnName(snakeCase(meta.singularName));
    }
    const fkIndexName = identifiers.getFkIndexName(joinTableName);
    const invFkIndexName = identifiers.getInverseFkIndexName(joinTableName);
    const metadataSchema = {
        singularName: joinTableName,
        uid: joinTableName,
        tableName: joinTableName,
        attributes: {
            [ID]: {
                type: 'increments'
            },
            [joinColumnName]: {
                type: 'integer',
                column: {
                    unsigned: true
                },
                // This must be set explicitly so that it is used instead of shortening the attribute name, which is already shortened
                columnName: joinColumnName
            },
            [inverseJoinColumnName]: {
                type: 'integer',
                column: {
                    unsigned: true
                },
                // This must be set explicitly so that it is used instead of shortening the attribute name, which is already shortened
                columnName: inverseJoinColumnName
            }
        },
        indexes: [
            {
                name: fkIndexName,
                columns: [
                    joinColumnName
                ]
            },
            {
                name: invFkIndexName,
                columns: [
                    inverseJoinColumnName
                ]
            },
            {
                name: identifiers.getUniqueIndexName(joinTableName),
                columns: [
                    joinColumnName,
                    inverseJoinColumnName
                ],
                type: 'unique'
            }
        ],
        foreignKeys: [
            {
                name: fkIndexName,
                columns: [
                    joinColumnName
                ],
                referencedColumns: [
                    ID
                ],
                referencedTable: meta.tableName,
                onDelete: 'CASCADE'
            },
            {
                name: invFkIndexName,
                columns: [
                    inverseJoinColumnName
                ],
                referencedColumns: [
                    ID
                ],
                referencedTable: targetMeta.tableName,
                onDelete: 'CASCADE'
            }
        ],
        lifecycles: {},
        columnToAttribute: {}
    };
    const joinTable = {
        __internal__: true,
        name: joinTableName,
        joinColumn: {
            name: joinColumnName,
            referencedColumn: ID,
            referencedTable: meta.tableName
        },
        inverseJoinColumn: {
            name: inverseJoinColumnName,
            referencedColumn: ID,
            referencedTable: targetMeta.tableName
        },
        pivotColumns: [
            joinColumnName,
            inverseJoinColumnName
        ]
    };
    // order
    if (isAnyToMany(attribute)) {
        metadataSchema.attributes[orderColumnName] = {
            type: 'float',
            column: {
                unsigned: true,
                defaultTo: null
            },
            columnName: orderColumnName
        };
        metadataSchema.indexes.push({
            name: identifiers.getOrderFkIndexName(joinTableName),
            columns: [
                orderColumnName
            ]
        });
        joinTable.orderColumnName = orderColumnName;
        joinTable.orderBy = {
            [orderColumnName]: 'asc'
        };
    }
    // inv order
    if (isBidirectional(attribute) && isManyToAny(attribute)) {
        metadataSchema.attributes[inverseOrderColumnName] = {
            type: 'float',
            column: {
                unsigned: true,
                defaultTo: null
            },
            columnName: inverseOrderColumnName
        };
        metadataSchema.indexes.push({
            name: identifiers.getOrderInverseFkIndexName(joinTableName),
            columns: [
                inverseOrderColumnName
            ]
        });
        joinTable.inverseOrderColumnName = inverseOrderColumnName;
    }
    metadata.add(metadataSchema);
    attribute.joinTable = joinTable;
    if (isBidirectional(attribute)) {
        const inverseAttribute = attribute.inversedBy ? targetMeta.attributes[attribute.inversedBy] : null;
        if (!inverseAttribute) {
            throw new Error(`inversedBy attribute ${attribute.inversedBy} not found target ${targetMeta.uid}`);
        }
        if (inverseAttribute.type !== 'relation') {
            throw new Error(`inversedBy attribute ${attribute.inversedBy} targets non relational attribute in ${targetMeta.uid}`);
        }
        inverseAttribute.joinTable = {
            __internal__: true,
            name: joinTableName,
            joinColumn: joinTable.inverseJoinColumn,
            inverseJoinColumn: joinTable.joinColumn,
            pivotColumns: joinTable.pivotColumns
        };
        if (isManyToAny(attribute)) {
            inverseAttribute.joinTable.orderColumnName = inverseOrderColumnName;
            inverseAttribute.joinTable.orderBy = {
                [inverseOrderColumnName]: 'asc'
            };
        }
        if (isAnyToMany(attribute)) {
            inverseAttribute.joinTable.inverseOrderColumnName = orderColumnName;
        }
    }
};
/**
 * Creates a relation metadata
 */ const createRelation = (attributeName, attribute, meta, metadata)=>{
    switch(attribute.relation){
        case 'oneToOne':
            return createOneToOne(attributeName, attribute, meta, metadata);
        case 'oneToMany':
            return createOneToMany(attributeName, attribute, meta, metadata);
        case 'manyToOne':
            return createManyToOne(attributeName, attribute, meta, metadata);
        case 'manyToMany':
            return createManyToMany(attributeName, attribute, meta, metadata);
        case 'morphToOne':
            return createMorphToOne(attributeName, attribute);
        case 'morphToMany':
            return createMorphToMany(attributeName, attribute, meta, metadata);
        case 'morphOne':
            return createMorphOne(attributeName, attribute, meta, metadata);
        case 'morphMany':
            return createMorphMany(attributeName, attribute, meta, metadata);
        default:
            {
                throw new Error(`Unknown relation`);
            }
    }
};

export { createRelation, hasInverseOrderColumn, hasOrderColumn, isAnyToMany, isAnyToOne, isBidirectional, isManyToAny, isOneToAny };
//# sourceMappingURL=relations.mjs.map
