'use strict';

var fp = require('lodash/fp');
var components = require('../../utils/components.js');

const sanitizeComponentLikeAttributes = (model, data)=>{
    const { attributes } = model;
    const componentLikeAttributesKey = Object.entries(attributes).filter(([, attribute])=>attribute.type === 'component' || attribute.type === 'dynamiczone').map(([key])=>key);
    return fp.omit(componentLikeAttributesKey, data);
};
const omitInvalidCreationAttributes = fp.omit([
    'id'
]);
const createEntityQuery = (strapi)=>{
    const components$1 = {
        async assignToEntity (uid, data) {
            const model = strapi.getModel(uid);
            const entityComponents = await components.createComponents(uid, data);
            const dataWithoutComponents = sanitizeComponentLikeAttributes(model, data);
            return fp.assign(entityComponents, dataWithoutComponents);
        },
        async get (uid, entity) {
            return components.getComponents(uid, entity);
        },
        delete (uid, componentsToDelete) {
            return components.deleteComponents(uid, componentsToDelete, {
                loadComponents: false
            });
        }
    };
    const query = (uid)=>{
        const create = async (params)=>{
            const dataWithComponents = await components$1.assignToEntity(uid, params.data);
            const sanitizedData = omitInvalidCreationAttributes(dataWithComponents);
            return strapi.db.query(uid).create({
                ...params,
                data: sanitizedData
            });
        };
        const createMany = async (params)=>{
            return Promise.resolve(params.data)// Create components for each entity
            .then(fp.map((data)=>components$1.assignToEntity(uid, data)))// Remove unwanted attributes
            .then(fp.map(omitInvalidCreationAttributes))// Execute a strapi db createMany query with all the entities + their created components
            .then((data)=>strapi.db.query(uid).createMany({
                    ...params,
                    data
                }));
        };
        const deleteMany = async (params)=>{
            const entitiesToDelete = await strapi.db.query(uid).findMany(params ?? {});
            if (!entitiesToDelete.length) {
                return null;
            }
            const componentsToDelete = await Promise.all(entitiesToDelete.map((entityToDelete)=>components$1.get(uid, entityToDelete)));
            const deletedEntities = await strapi.db.query(uid).deleteMany(params);
            await Promise.all(componentsToDelete.map((compos)=>components$1.delete(uid, compos)));
            return deletedEntities;
        };
        const getDeepPopulateComponentLikeQuery = (contentType, params = {
            select: '*'
        })=>{
            const { attributes } = contentType;
            const populate = {};
            const entries = Object.entries(attributes);
            for (const [key, attribute] of entries){
                if (attribute.type === 'component') {
                    const component = strapi.getModel(attribute.component);
                    const subPopulate = getDeepPopulateComponentLikeQuery(component, params);
                    if ((fp.isArray(subPopulate) || fp.isObject(subPopulate)) && fp.size(subPopulate) > 0) {
                        populate[key] = {
                            ...params,
                            populate: subPopulate
                        };
                    }
                    if (fp.isArray(subPopulate) && fp.isEmpty(subPopulate)) {
                        populate[key] = {
                            ...params
                        };
                    }
                }
                if (attribute.type === 'dynamiczone') {
                    const { components: componentsUID } = attribute;
                    const on = {};
                    for (const componentUID of componentsUID){
                        const component = strapi.getModel(componentUID);
                        const subPopulate = getDeepPopulateComponentLikeQuery(component, params);
                        if ((fp.isArray(subPopulate) || fp.isObject(subPopulate)) && fp.size(subPopulate) > 0) {
                            on[componentUID] = {
                                ...params,
                                populate: subPopulate
                            };
                        }
                        if (fp.isArray(subPopulate) && fp.isEmpty(subPopulate)) {
                            on[componentUID] = {
                                ...params
                            };
                        }
                    }
                    populate[key] = fp.size(on) > 0 ? {
                        on
                    } : true;
                }
            }
            const values = Object.values(populate);
            if (values.every((value)=>value === true)) {
                return Object.keys(populate);
            }
            return populate;
        };
        return {
            create,
            createMany,
            deleteMany,
            getDeepPopulateComponentLikeQuery,
            get deepPopulateComponentLikeQuery () {
                const contentType = strapi.getModel(uid);
                return getDeepPopulateComponentLikeQuery(contentType);
            }
        };
    };
    return query;
};

exports.createEntityQuery = createEntityQuery;
//# sourceMappingURL=entity.js.map
