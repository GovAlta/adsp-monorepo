'use strict';

var _ = require('lodash/fp');
var index = require('../utils/identifiers/index.js');
var types = require('../utils/types.js');
var relations = require('./relations.js');

class Metadata extends Map {
    // TODO: we expose the global identifiers in this way so that in the future we can instantiate our own
    // However, it should NOT be done until all the methods used by metadata can be part of this metadata object
    // and access this one; currently they all access the global identifiers directly.
    get identifiers() {
        return index.identifiers;
    }
    get(key) {
        if (!super.has(key)) {
            throw new Error(`Metadata for "${key}" not found`);
        }
        return super.get(key);
    }
    add(meta) {
        return this.set(meta.uid, meta);
    }
    /**
   * Validate the DB metadata, throwing an error if a duplicate DB table name is detected
   */ validate() {
        const seenTables = new Map();
        for (const meta of this.values()){
            if (seenTables.get(meta.tableName)) {
                throw new Error(`DB table "${meta.tableName}" already exists. Change the collectionName of the related content type.`);
            }
            seenTables.set(meta.tableName, true);
        }
    }
    loadModels(models) {
        // init pass
        for (const model of _.cloneDeep(models ?? [])){
            const tableName = index.identifiers.getTableName(model.tableName);
            this.add({
                ...model,
                tableName,
                attributes: {
                    ...model.attributes
                },
                lifecycles: model.lifecycles ?? {},
                indexes: model.indexes ?? [],
                foreignKeys: model.foreignKeys ?? [],
                columnToAttribute: {}
            });
        }
        // build compos / relations
        for (const meta of this.values()){
            for (const [attributeName, attribute] of Object.entries(meta.attributes)){
                try {
                    if (attribute.unstable_virtual) {
                        continue;
                    }
                    if (types.isRelationalAttribute(attribute)) {
                        relations.createRelation(attributeName, attribute, meta, this);
                        continue;
                    }
                    createAttribute(attributeName, attribute);
                } catch (error) {
                    if (error instanceof Error) {
                        throw new Error(`Error on attribute ${attributeName} in model ${meta.singularName}(${meta.uid}): ${error.message}`);
                    }
                }
            }
        }
        for (const meta of this.values()){
            const columnToAttribute = Object.keys(meta.attributes).reduce((acc, key)=>{
                const attribute = meta.attributes[key];
                if ('columnName' in attribute) {
                    return Object.assign(acc, {
                        [attribute.columnName || key]: key
                    });
                }
                return Object.assign(acc, {
                    [key]: key
                });
            }, {});
            meta.columnToAttribute = columnToAttribute;
        }
        this.validate();
    }
}
const createAttribute = (attributeName, attribute)=>{
    // if the attribute has already set its own column name, use that
    // this will prevent us from shortening a name twice
    if ('columnName' in attribute && attribute.columnName) {
        return;
    }
    const columnName = index.identifiers.getColumnName(_.snakeCase(attributeName));
    Object.assign(attribute, {
        columnName
    });
};

exports.Metadata = Metadata;
//# sourceMappingURL=metadata.js.map
