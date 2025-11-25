'use strict';

var _ = require('lodash');
var fp = require('lodash/fp');
var utils = require('@strapi/utils');

const isDialectMySQL = ()=>strapi.db?.dialect.client === 'mysql';
function omitComponentData(contentType, data) {
    const { attributes } = contentType;
    const componentAttributes = Object.keys(attributes).filter((attributeName)=>utils.contentTypes.isComponentAttribute(attributes[attributeName]));
    return fp.omit(componentAttributes, data);
}
// NOTE: we could generalize the logic to allow CRUD of relation directly in the DB layer
const createComponents = async (uid, data)=>{
    const { attributes = {} } = strapi.getModel(uid);
    const componentBody = {};
    const attributeNames = Object.keys(attributes);
    for (const attributeName of attributeNames){
        const attribute = attributes[attributeName];
        if (!fp.has(attributeName, data) || !utils.contentTypes.isComponentAttribute(attribute)) {
            continue;
        }
        if (attribute.type === 'component') {
            const { component: componentUID, repeatable = false } = attribute;
            const componentValue = data[attributeName];
            if (componentValue === null) {
                continue;
            }
            if (repeatable === true) {
                if (!Array.isArray(componentValue)) {
                    throw new Error('Expected an array to create repeatable component');
                }
                // MySQL/MariaDB can cause deadlocks here if concurrency higher than 1
                const components = await utils.async.map(componentValue, (value)=>createComponent(componentUID, value), {
                    concurrency: isDialectMySQL() && !strapi.db?.inTransaction() ? 1 : Infinity
                });
                componentBody[attributeName] = components.map(({ id })=>{
                    return {
                        id,
                        __pivot: {
                            field: attributeName,
                            component_type: componentUID
                        }
                    };
                });
            } else {
                const component = await createComponent(componentUID, componentValue);
                componentBody[attributeName] = {
                    id: component.id,
                    __pivot: {
                        field: attributeName,
                        component_type: componentUID
                    }
                };
            }
            continue;
        }
        if (attribute.type === 'dynamiczone') {
            const dynamiczoneValues = data[attributeName];
            if (!Array.isArray(dynamiczoneValues)) {
                throw new Error('Expected an array to create repeatable component');
            }
            const createDynamicZoneComponents = async (value)=>{
                const { id } = await createComponent(value.__component, value);
                return {
                    id,
                    __component: value.__component,
                    __pivot: {
                        field: attributeName
                    }
                };
            };
            // MySQL/MariaDB can cause deadlocks here if concurrency higher than 1
            componentBody[attributeName] = await utils.async.map(dynamiczoneValues, createDynamicZoneComponents, {
                concurrency: isDialectMySQL() && !strapi.db?.inTransaction() ? 1 : Infinity
            });
            continue;
        }
    }
    return componentBody;
};
const getComponents = async (uid, entity)=>{
    const componentAttributes = utils.contentTypes.getComponentAttributes(strapi.getModel(uid));
    if (_.isEmpty(componentAttributes)) {
        return {};
    }
    return strapi.db.query(uid).load(entity, componentAttributes);
};
const deleteComponents = async (uid, entityToDelete, { loadComponents = true } = {})=>{
    const { attributes = {} } = strapi.getModel(uid);
    const attributeNames = Object.keys(attributes);
    for (const attributeName of attributeNames){
        const attribute = attributes[attributeName];
        if (attribute.type === 'component' || attribute.type === 'dynamiczone') {
            let value;
            if (loadComponents) {
                value = await strapi.db.query(uid).load(entityToDelete, attributeName);
            } else {
                value = entityToDelete[attributeName];
            }
            if (!value) {
                continue;
            }
            if (attribute.type === 'component') {
                const { component: componentUID } = attribute;
                // MySQL/MariaDB can cause deadlocks here if concurrency higher than 1
                await utils.async.map(_.castArray(value), (subValue)=>deleteComponent(componentUID, subValue), {
                    concurrency: isDialectMySQL() && !strapi.db?.inTransaction() ? 1 : Infinity
                });
            } else {
                // delete dynamic zone components
                // MySQL/MariaDB can cause deadlocks here if concurrency higher than 1
                await utils.async.map(_.castArray(value), (subValue)=>deleteComponent(subValue.__component, subValue), {
                    concurrency: isDialectMySQL() && !strapi.db?.inTransaction() ? 1 : Infinity
                });
            }
            continue;
        }
    }
};
/** *************************
    Component queries
************************** */ // components can have nested compos so this must be recursive
const createComponent = async (uid, data)=>{
    const model = strapi.getModel(uid);
    const componentData = await createComponents(uid, data);
    const transform = fp.pipe(// Make sure we don't save the component with a pre-defined ID
    fp.omit('id'), // Remove the component data from the original data object ...
    (payload)=>omitComponentData(model, payload), // ... and assign the newly created component instead
    fp.assign(componentData));
    return strapi.db.query(uid).create({
        data: transform(data)
    });
};
const deleteComponent = async (uid, componentToDelete)=>{
    await deleteComponents(uid, componentToDelete);
    await strapi.db.query(uid).delete({
        where: {
            id: componentToDelete.id
        }
    });
};
/**
 * Resolve the component UID of an entity's attribute based
 * on a given path (components & dynamic zones only)
 */ const resolveComponentUID = ({ paths, strapi: strapi1, data, contentType })=>{
    let value = data;
    let cType = contentType;
    for (const path of paths){
        value = fp.get(path, value);
        // Needed when the value of cType should be computed
        // based on the next value (eg: dynamic zones)
        if (typeof cType === 'function') {
            cType = cType(value);
        }
        if (path in cType.attributes) {
            const attribute = cType.attributes[path];
            if (attribute.type === 'component') {
                cType = strapi1.getModel(attribute.component);
            }
            if (attribute.type === 'dynamiczone') {
                cType = ({ __component })=>strapi1.getModel(__component);
            }
        }
    }
    if ('uid' in cType) {
        return cType.uid;
    }
    return undefined;
};

exports.createComponents = createComponents;
exports.deleteComponent = deleteComponent;
exports.deleteComponents = deleteComponents;
exports.getComponents = getComponents;
exports.omitComponentData = omitComponentData;
exports.resolveComponentUID = resolveComponentUID;
//# sourceMappingURL=components.js.map
