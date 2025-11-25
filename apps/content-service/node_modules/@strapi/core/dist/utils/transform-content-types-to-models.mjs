import { createId } from '@paralleldrive/cuid2';
import assert from 'node:assert';
import fp from 'lodash/fp';

/**
 * Because strapi/database models don't know about things like components or dynamic zones, we use this file to convert them
 * to a relations format that it recognizes
 *
 * Therefore we have to keep an additional set of helpers/extensions to the database naming methods
 *
 * IMPORTANT!
 * If we use short versions of anything, we MUST call getNameFromTokens directly; attempting to shorten them ourselves
 * prevents the unshortened name map from being filled properly, so for example it will think that the short name
 * 'collection4f3a_cmps' maps to the unshortened 'collectionname_cmps' rather than 'collectionname_components'
 * Therefore, we only use the identifiers helpers in cases where we do not do any of our own shortening
 */ const getComponentJoinTableName = (collectionName, identifiers)=>{
    return identifiers.getNameFromTokens([
        {
            name: collectionName,
            compressible: true
        },
        {
            name: 'components',
            shortName: 'cmps',
            compressible: false
        }
    ]);
};
const getDzJoinTableName = (collectionName, identifiers)=>{
    return identifiers.getNameFromTokens([
        {
            name: collectionName,
            compressible: true
        },
        {
            name: 'components',
            shortName: 'cmps',
            compressible: false
        }
    ]);
};
const getComponentJoinColumnEntityName = (identifiers)=>{
    return identifiers.getNameFromTokens([
        {
            name: 'entity',
            compressible: false
        },
        {
            name: 'id',
            compressible: false
        }
    ]);
};
const getComponentJoinColumnInverseName = (identifiers)=>{
    return identifiers.getNameFromTokens([
        {
            name: 'component',
            shortName: 'cmp',
            compressible: false
        },
        {
            name: 'id',
            compressible: false
        }
    ]);
};
const getComponentTypeColumn = (identifiers)=>{
    return identifiers.getNameFromTokens([
        {
            name: 'component_type',
            compressible: false
        }
    ]);
};
const getComponentFkIndexName = (contentType, identifiers)=>{
    return identifiers.getNameFromTokens([
        {
            name: contentType,
            compressible: true
        },
        {
            name: 'entity',
            compressible: false
        },
        {
            name: 'fk',
            compressible: false
        }
    ]);
};
// Transforms an attribute (particularly for relation types) into the format that strapi/database accepts
const transformAttribute = (name, attribute, contentType, identifiers)=>{
    switch(attribute.type){
        case 'media':
            {
                return {
                    type: 'relation',
                    relation: attribute.multiple === true ? 'morphMany' : 'morphOne',
                    target: 'plugin::upload.file',
                    morphBy: 'related'
                };
            }
        case 'component':
            {
                const joinTableName = getComponentJoinTableName(contentType.collectionName, identifiers);
                const joinColumnEntityName = getComponentJoinColumnEntityName(identifiers);
                const joinColumnInverseName = getComponentJoinColumnInverseName(identifiers);
                const compTypeColumn = getComponentTypeColumn(identifiers);
                return {
                    type: 'relation',
                    relation: attribute.repeatable === true ? 'oneToMany' : 'oneToOne',
                    target: attribute.component,
                    // We need the join table name to be deterministic,
                    // We need to allow passing the join table name as an option
                    joinTable: {
                        name: joinTableName,
                        joinColumn: {
                            name: joinColumnEntityName,
                            referencedColumn: identifiers.ID_COLUMN
                        },
                        inverseJoinColumn: {
                            name: joinColumnInverseName,
                            referencedColumn: identifiers.ID_COLUMN
                        },
                        on: {
                            field: name
                        },
                        orderColumnName: identifiers.ORDER_COLUMN,
                        orderBy: {
                            order: 'asc'
                        },
                        pivotColumns: [
                            joinColumnEntityName,
                            joinColumnInverseName,
                            identifiers.FIELD_COLUMN,
                            compTypeColumn
                        ]
                    }
                };
            }
        case 'dynamiczone':
            {
                const joinTableName = getDzJoinTableName(contentType.collectionName, identifiers);
                const joinColumnEntityName = getComponentJoinColumnEntityName(identifiers);
                const joinColumnInverseName = getComponentJoinColumnInverseName(identifiers);
                const compTypeColumn = getComponentTypeColumn(identifiers);
                return {
                    type: 'relation',
                    relation: 'morphToMany',
                    // TODO: handle restrictions at some point
                    // target: attribute.components,
                    joinTable: {
                        name: joinTableName,
                        joinColumn: {
                            name: joinColumnEntityName,
                            referencedColumn: identifiers.ID_COLUMN
                        },
                        morphColumn: {
                            idColumn: {
                                name: joinColumnInverseName,
                                referencedColumn: identifiers.ID_COLUMN
                            },
                            typeColumn: {
                                name: compTypeColumn
                            },
                            typeField: '__component'
                        },
                        on: {
                            field: name
                        },
                        orderBy: {
                            order: 'asc'
                        },
                        pivotColumns: [
                            joinColumnEntityName,
                            joinColumnInverseName,
                            identifiers.FIELD_COLUMN,
                            compTypeColumn
                        ]
                    }
                };
            }
        default:
            {
                return attribute;
            }
    }
};
const transformAttributes = (contentType, identifiers)=>{
    return Object.keys(contentType.attributes || {}).reduce((attrs, attrName)=>{
        return {
            ...attrs,
            [attrName]: transformAttribute(attrName, contentType.attributes[attrName], contentType, identifiers)
        };
    }, {});
};
const hasComponentsOrDz = (contentType)=>{
    return Object.values(contentType.attributes || {}).some(({ type })=>type === 'dynamiczone' || type === 'component');
};
const createDocumentId = createId;
const createCompoLinkModel = (contentType, identifiers)=>{
    const name = getComponentJoinTableName(contentType.collectionName, identifiers);
    const entityId = getComponentJoinColumnEntityName(identifiers);
    const componentId = getComponentJoinColumnInverseName(identifiers);
    const compTypeColumn = getComponentTypeColumn(identifiers);
    const fkIndex = getComponentFkIndexName(contentType.collectionName, identifiers);
    return {
        // TODO: make sure there can't be any conflicts with a prefix
        singularName: name,
        uid: name,
        tableName: name,
        attributes: {
            [identifiers.ID_COLUMN]: {
                type: 'increments'
            },
            [entityId]: {
                type: 'integer',
                column: {
                    unsigned: true
                }
            },
            [componentId]: {
                type: 'integer',
                column: {
                    unsigned: true
                }
            },
            [compTypeColumn]: {
                type: 'string'
            },
            [identifiers.FIELD_COLUMN]: {
                type: 'string'
            },
            [identifiers.ORDER_COLUMN]: {
                type: 'float',
                column: {
                    unsigned: true,
                    defaultTo: null
                }
            }
        },
        indexes: [
            {
                name: identifiers.getIndexName([
                    contentType.collectionName,
                    identifiers.FIELD_COLUMN
                ]),
                columns: [
                    identifiers.FIELD_COLUMN
                ]
            },
            {
                name: identifiers.getIndexName([
                    contentType.collectionName,
                    compTypeColumn
                ]),
                columns: [
                    compTypeColumn
                ]
            },
            {
                name: fkIndex,
                columns: [
                    entityId
                ]
            },
            {
                // NOTE: since we don't include attribute names, we need to be careful not to create another unique index
                name: identifiers.getUniqueIndexName([
                    contentType.collectionName
                ]),
                columns: [
                    entityId,
                    componentId,
                    identifiers.FIELD_COLUMN,
                    compTypeColumn
                ],
                type: 'unique'
            }
        ],
        foreignKeys: [
            {
                name: fkIndex,
                columns: [
                    entityId
                ],
                referencedColumns: [
                    identifiers.ID_COLUMN
                ],
                referencedTable: identifiers.getTableName(contentType.collectionName),
                onDelete: 'CASCADE'
            }
        ]
    };
};
const transformContentTypesToModels = (contentTypes, identifiers)=>{
    const models = [];
    contentTypes.forEach((contentType)=>{
        assert(contentType.collectionName, 'Content type "collectionName" is required');
        assert(contentType.modelName, 'Content type "modelName" is required');
        assert(contentType.uid, 'Content type "uid" is required');
        // Add document id to content types
        // as it is not documented
        const documentIdAttribute = contentType.modelType === 'contentType' ? {
            documentId: {
                type: 'string',
                default: createDocumentId
            }
        } : {};
        // TODO: this needs to be combined with getReservedNames, we should not be maintaining two lists
        // Prevent user from creating a documentId attribute
        const reservedAttributeNames = [
            'document_id',
            identifiers.ID_COLUMN
        ];
        Object.keys(contentType.attributes || {}).forEach((attributeName)=>{
            const snakeCasedAttributeName = fp.snakeCase(attributeName);
            if (reservedAttributeNames.includes(snakeCasedAttributeName)) {
                throw new Error(`The attribute "${attributeName}" is reserved and cannot be used in a model. Please rename "${contentType.modelName}" attribute "${attributeName}" to something else.`);
            }
        });
        if (hasComponentsOrDz(contentType)) {
            const compoLinkModel = createCompoLinkModel(contentType, identifiers);
            models.push(compoLinkModel);
        }
        const model = {
            uid: contentType.uid,
            singularName: contentType.modelName,
            tableName: contentType.collectionName,
            attributes: {
                [identifiers.ID_COLUMN]: {
                    type: 'increments'
                },
                ...documentIdAttribute,
                ...transformAttributes(contentType, identifiers)
            },
            indexes: contentType.indexes,
            foreignKeys: contentType.foreignKeys,
            lifecycles: contentType?.lifecycles ?? {}
        };
        // Add indexes to model
        if (contentType.modelType === 'contentType') {
            model.indexes = [
                ...model.indexes || [],
                {
                    name: identifiers.getIndexName([
                        contentType.collectionName,
                        'documents'
                    ]),
                    // Filter attributes that are not in the schema
                    columns: [
                        'documentId',
                        'locale',
                        'publishedAt'
                    ].filter((n)=>model.attributes[n]).map((name)=>identifiers.getColumnName(fp.snakeCase(name)))
                }
            ];
        }
        models.push(model);
    });
    return models;
};

export { createDocumentId, getComponentFkIndexName, getComponentJoinColumnEntityName, getComponentJoinColumnInverseName, getComponentJoinTableName, getComponentTypeColumn, getDzJoinTableName, hasComponentsOrDz, transformAttribute, transformAttributes, transformContentTypesToModels };
//# sourceMappingURL=transform-content-types-to-models.mjs.map
