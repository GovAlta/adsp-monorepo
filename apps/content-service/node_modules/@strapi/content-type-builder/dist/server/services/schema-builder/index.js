'use strict';

var path = require('path');
var _ = require('lodash');
var utils = require('@strapi/utils');
var schemaHandler = require('./schema-handler.js');
var componentBuilder = require('./component-builder.js');
var contentTypeBuilder = require('./content-type-builder.js');

/**
 * Creates a content type schema builder instance
 */ function createBuilder() {
    const components = Object.values(strapi.components).map((componentInput)=>({
            category: componentInput.category,
            modelName: componentInput.modelName,
            plugin: componentInput.modelName,
            uid: componentInput.uid,
            filename: componentInput.__filename__,
            dir: path.join(strapi.dirs.app.components, componentInput.category),
            schema: componentInput.__schema__,
            config: componentInput.config
        }));
    const contentTypes = Object.values(strapi.contentTypes).map((contentTypeInput)=>{
        const dir = contentTypeInput.plugin ? path.join(strapi.dirs.app.extensions, contentTypeInput.plugin, 'content-types', contentTypeInput.info.singularName) : path.join(strapi.dirs.app.api, contentTypeInput.apiName, 'content-types', contentTypeInput.info.singularName);
        return {
            modelName: contentTypeInput.modelName,
            plugin: contentTypeInput.plugin,
            uid: contentTypeInput.uid,
            filename: 'schema.json',
            dir,
            schema: contentTypeInput.__schema__,
            config: contentTypeInput.config
        };
    });
    return createSchemaBuilder({
        components,
        contentTypes
    });
}
function createSchemaBuilder({ components, contentTypes }) {
    const tmpComponents = new Map();
    const tmpContentTypes = new Map();
    // init temporary ContentTypes
    Object.keys(contentTypes).forEach((key)=>{
        tmpContentTypes.set(contentTypes[key].uid, schemaHandler(contentTypes[key]));
    });
    // init temporary components
    Object.keys(components).forEach((key)=>{
        tmpComponents.set(components[key].uid, schemaHandler(components[key]));
    });
    return {
        get components () {
            return tmpComponents;
        },
        get contentTypes () {
            return tmpContentTypes;
        },
        /**
     * Convert Attributes received from the API to the right syntax
     */ convertAttributes (attributes) {
            return Object.keys(attributes).reduce((acc, key)=>{
                acc[key] = this.convertAttribute(attributes[key]);
                return acc;
            }, {});
        },
        convertAttribute (attribute) {
            const { configurable, private: isPrivate, conditions } = attribute;
            const baseProperties = {
                private: isPrivate === true ? true : undefined,
                configurable: configurable === false ? false : undefined,
                // IMPORTANT: Preserve conditions only if they exist and are not undefined/null
                ...conditions !== undefined && conditions !== null && {
                    conditions
                }
            };
            if (attribute.type === 'relation') {
                const { target, relation, targetAttribute, dominant, ...restOfProperties } = attribute;
                const attr = {
                    type: 'relation',
                    relation,
                    target,
                    ...restOfProperties,
                    ...baseProperties
                };
                // TODO: uncomment this when we pre-create empty types and targets exists if we create multiple types at once
                // if (target && !this.contentTypes.has(target)) {
                //   throw new errors.ApplicationError(`target: ${target} does not exist`);
                // }
                if (_.isNil(targetAttribute)) {
                    return attr;
                }
                if ([
                    'oneToOne',
                    'manyToMany'
                ].includes(relation) && dominant === true) {
                    attr.inversedBy = targetAttribute;
                } else if ([
                    'oneToOne',
                    'manyToMany'
                ].includes(relation) && dominant === false) {
                    attr.mappedBy = targetAttribute;
                } else if ([
                    'oneToOne',
                    'manyToOne',
                    'manyToMany'
                ].includes(relation)) {
                    attr.inversedBy = targetAttribute;
                } else if ([
                    'oneToMany'
                ].includes(relation)) {
                    attr.mappedBy = targetAttribute;
                }
                return attr;
            }
            return {
                ...attribute,
                ...baseProperties
            };
        },
        ...componentBuilder(),
        ...contentTypeBuilder(),
        /**
     * Write all type to files
     */ writeFiles () {
            const schemas = [
                ...Array.from(tmpComponents.values()),
                ...Array.from(tmpContentTypes.values())
            ];
            return Promise.all(schemas.map((schema)=>schema.flush())).catch((error)=>{
                strapi.log.error('Error writing schema files');
                strapi.log.error(error);
                return this.rollback();
            }).catch((error)=>{
                strapi.log.error('Error rolling back schema files. You might need to fix your files manually');
                strapi.log.error(error);
                throw new utils.errors.ApplicationError('Invalid schema edition');
            });
        },
        /**
     * rollback all files
     */ rollback () {
            return Promise.all([
                ...Array.from(tmpComponents.values()),
                ...Array.from(tmpContentTypes.values())
            ].map((schema)=>schema.rollback()));
        }
    };
}

module.exports = createBuilder;
//# sourceMappingURL=index.js.map
