import { get, has } from 'lodash';
import { formatAttributes, replaceTemporaryUIDs } from '../utils/attributes.mjs';
import createBuilder from './schema-builder/index.mjs';

/**
 * Formats a component attributes
 */ const formatComponent = (component)=>{
    const { uid, modelName, connection, collectionName, info, category } = component;
    return {
        uid,
        category,
        apiId: modelName,
        schema: {
            displayName: get(info, 'displayName'),
            description: get(info, 'description', ''),
            icon: get(info, 'icon'),
            connection,
            collectionName,
            pluginOptions: component.pluginOptions,
            attributes: formatAttributes(component)
        }
    };
};
/**
 * Creates a component and handle the nested components sent with it
 */ const createComponent = async ({ component, components = [] })=>{
    const builder = createBuilder();
    const uidMap = builder.createNewComponentUIDMap(components);
    const replaceTmpUIDs = replaceTemporaryUIDs(uidMap);
    const newComponent = builder.createComponent(replaceTmpUIDs(component));
    components.forEach((component)=>{
        if (!has(component, 'uid')) {
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
    const builder = createBuilder();
    const uidMap = builder.createNewComponentUIDMap(components);
    const replaceTmpUIDs = replaceTemporaryUIDs(uidMap);
    const updatedComponent = builder.editComponent({
        uid,
        ...replaceTmpUIDs(component)
    });
    components.forEach((component)=>{
        if (!has(component, 'uid')) {
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
    const builder = createBuilder();
    const deletedComponent = builder.deleteComponent(uid);
    await builder.writeFiles();
    strapi.eventHub.emit('component.delete', {
        component: deletedComponent
    });
    return deletedComponent;
};

export { createComponent, deleteComponent, editComponent, formatComponent };
//# sourceMappingURL=components.mjs.map
