'use strict';

var _ = require('lodash');
var attributes = require('../utils/attributes.js');
var index = require('./schema-builder/index.js');

/**
 * Formats a component attributes
 */ const formatComponent = (component)=>{
    const { uid, modelName, connection, collectionName, info, category } = component;
    return {
        uid,
        category,
        apiId: modelName,
        schema: {
            displayName: _.get(info, 'displayName'),
            description: _.get(info, 'description', ''),
            icon: _.get(info, 'icon'),
            connection,
            collectionName,
            pluginOptions: component.pluginOptions,
            attributes: attributes.formatAttributes(component)
        }
    };
};
/**
 * Creates a component and handle the nested components sent with it
 */ const createComponent = async ({ component, components = [] })=>{
    const builder = index();
    const uidMap = builder.createNewComponentUIDMap(components);
    const replaceTmpUIDs = attributes.replaceTemporaryUIDs(uidMap);
    const newComponent = builder.createComponent(replaceTmpUIDs(component));
    components.forEach((component)=>{
        if (!_.has(component, 'uid')) {
            return builder.createComponent(replaceTmpUIDs(component));
        }
        return builder.editComponent(replaceTmpUIDs(component));
    });
    await builder.writeFiles();
    strapi.eventHub.emit('component.create', {
        component: newComponent
    });
    return newComponent;
};
const editComponent = async (uid, { component, components = [] })=>{
    const builder = index();
    const uidMap = builder.createNewComponentUIDMap(components);
    const replaceTmpUIDs = attributes.replaceTemporaryUIDs(uidMap);
    const updatedComponent = builder.editComponent({
        uid,
        ...replaceTmpUIDs(component)
    });
    components.forEach((component)=>{
        if (!_.has(component, 'uid')) {
            return builder.createComponent(replaceTmpUIDs(component));
        }
        return builder.editComponent(replaceTmpUIDs(component));
    });
    await builder.writeFiles();
    strapi.eventHub.emit('component.update', {
        component: updatedComponent
    });
    return updatedComponent;
};
const deleteComponent = async (uid)=>{
    const builder = index();
    const deletedComponent = builder.deleteComponent(uid);
    await builder.writeFiles();
    strapi.eventHub.emit('component.delete', {
        component: deletedComponent
    });
    return deletedComponent;
};

exports.createComponent = createComponent;
exports.deleteComponent = deleteComponent;
exports.editComponent = editComponent;
exports.formatComponent = formatComponent;
//# sourceMappingURL=components.js.map
