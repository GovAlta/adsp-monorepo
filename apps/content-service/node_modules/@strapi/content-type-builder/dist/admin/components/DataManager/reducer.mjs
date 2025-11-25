import merge from 'lodash/merge';
import omit from 'lodash/omit';
import { getRelationType } from '../../utils/getRelationType.mjs';
import { makeUnique } from '../../utils/makeUnique.mjs';
import { createUndoRedoSlice } from './undoRedo.mjs';

const initialState = {
    components: {},
    contentTypes: {},
    initialComponents: {},
    initialContentTypes: {},
    reservedNames: {
        models: [],
        attributes: []
    },
    isLoading: true
};
const ONE_SIDE_RELATIONS = [
    'oneWay',
    'manyWay'
];
const getOppositeRelation = (originalRelation)=>{
    if (originalRelation === 'manyToOne') {
        return 'oneToMany';
    }
    if (originalRelation === 'oneToMany') {
        return 'manyToOne';
    }
    return originalRelation;
};
const findAttributeIndex = (type, attributeToFind)=>{
    return type.attributes.findIndex(({ name })=>name === attributeToFind);
};
const getType = (state, { forTarget, targetUid })=>{
    return forTarget === 'contentType' ? state.contentTypes[targetUid] : state.components[targetUid];
};
// TODO: use initial state when chnaging back to the initial state without knowing
const setStatus = (type, status)=>{
    switch(type.status){
        case 'NEW':
        case 'REMOVED':
            {
                break;
            }
        default:
            {
                type.status = status;
            }
    }
};
const getNewStatus = (oldStatus, newStatus)=>{
    if (oldStatus === 'NEW' || oldStatus === 'REMOVED') {
        return oldStatus;
    }
    return newStatus;
};
const setAttributeStatus = (attribute, status)=>{
    attribute.status = getNewStatus(attribute.status, status);
};
const createAttribute = (properties)=>{
    return {
        ...properties,
        status: 'NEW'
    };
};
const setAttributeAt = (type, index, attribute)=>{
    const previousAttribute = type.attributes[index];
    const newStatus = getNewStatus(previousAttribute.status, 'CHANGED');
    type.attributes[index] = {
        ...attribute,
        status: newStatus
    };
    setStatus(type, 'CHANGED');
};
const pushAttribute = (type, attribute)=>{
    type.attributes.push(attribute);
    setStatus(type, 'CHANGED');
};
const removeAttributeAt = (type, index)=>{
    const attr = type.attributes[index];
    setStatus(type, 'CHANGED');
    if (attr.status === 'NEW') {
        type.attributes.splice(index, 1);
    } else {
        setAttributeStatus(attr, 'REMOVED');
    }
};
const replaceAttributeAt = (type, index, attribute)=>{
    type.attributes[index] = attribute;
    setStatus(type, 'CHANGED');
};
const removeAttributeByName = (type, name)=>{
    const idx = type.attributes.findIndex((attr)=>attr.name === name);
    const attr = type.attributes[idx];
    setStatus(type, 'CHANGED');
    if (attr.status === 'NEW') {
        type.attributes.splice(idx, 1);
    } else {
        setAttributeStatus(attr, 'REMOVED');
    }
};
const updateType = (type, data)=>{
    merge(type, data);
    setStatus(type, 'CHANGED');
};
const slice = createUndoRedoSlice({
    name: 'data-manager',
    initialState,
    reducers: {
        init: (state, action)=>{
            const { components, contentTypes, reservedNames } = action.payload;
            state.components = components;
            state.initialComponents = components;
            state.initialContentTypes = contentTypes;
            state.contentTypes = contentTypes;
            state.reservedNames = reservedNames;
            state.isLoading = false;
        },
        createComponentSchema: (state, action)=>{
            const { uid, data, componentCategory } = action.payload;
            const newSchema = {
                uid: uid,
                status: 'NEW',
                category: componentCategory,
                modelName: data.displayName,
                globalId: data.displayName,
                info: {
                    icon: data.icon,
                    displayName: data.displayName
                },
                attributes: [],
                modelType: 'component'
            };
            state.components[uid] = newSchema;
        },
        createSchema: (state, action)=>{
            const { uid, data } = action.payload;
            const { displayName, singularName, pluralName, kind, draftAndPublish, pluginOptions } = data;
            const newSchema = {
                uid: uid,
                status: 'NEW',
                visible: true,
                modelType: 'contentType',
                restrictRelationsTo: null,
                attributes: [],
                kind,
                modelName: displayName,
                globalId: displayName,
                options: {
                    draftAndPublish
                },
                info: {
                    displayName,
                    singularName,
                    pluralName
                },
                pluginOptions
            };
            state.contentTypes[uid] = newSchema;
        },
        addAttribute: (state, action)=>{
            const { attributeToSet, forTarget, targetUid } = action.payload;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            const attribute = createAttribute(omit(attributeToSet, 'createComponent'));
            if (attribute.type === 'relation') {
                const target = attribute.target;
                const targetAttribute = attribute.targetAttribute || null;
                const relation = attribute.relation;
                const relationType = getRelationType(relation, targetAttribute);
                const isBidirectionalRelation = ![
                    'oneWay',
                    'manyWay'
                ].includes(relationType);
                if (isBidirectionalRelation) {
                    const oppositeAttribute = createAttribute({
                        name: targetAttribute,
                        relation: getOppositeRelation(relationType),
                        target: type.uid,
                        targetAttribute: attribute.name,
                        type: 'relation',
                        private: attribute.private
                    });
                    const targetType = getType(state, {
                        forTarget,
                        targetUid: target
                    });
                    pushAttribute(targetType, oppositeAttribute);
                }
            }
            pushAttribute(type, attribute);
            setStatus(type, 'CHANGED');
        },
        moveAttribute: (state, action)=>{
            const { forTarget, targetUid, from, to } = action.payload;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            const attribute = type.attributes[from];
            type.attributes.splice(from, 1);
            type.attributes.splice(to, 0, attribute);
            setStatus(type, 'CHANGED');
        },
        addCustomFieldAttribute: (state, action)=>{
            const { attributeToSet, forTarget, targetUid } = action.payload;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            pushAttribute(type, createAttribute(attributeToSet));
        },
        addCreatedComponentToDynamicZone: (state, action)=>{
            const { dynamicZoneTarget, componentsToAdd, forTarget, targetUid } = action.payload;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            const dzAttributeIndex = findAttributeIndex(type, dynamicZoneTarget);
            const attr = type.attributes[dzAttributeIndex];
            componentsToAdd.forEach((componentUid)=>{
                attr.components.push(componentUid);
            });
            setAttributeStatus(attr, 'CHANGED');
            setStatus(type, 'CHANGED');
        },
        changeDynamicZoneComponents: (state, action)=>{
            const { dynamicZoneTarget, newComponents, forTarget, targetUid } = action.payload;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            const dzAttributeIndex = findAttributeIndex(type, dynamicZoneTarget);
            const attr = type.attributes[dzAttributeIndex];
            const currentDZComponents = attr.components;
            const updatedComponents = makeUnique([
                ...currentDZComponents,
                ...newComponents
            ]);
            setStatus(type, 'CHANGED');
            setAttributeStatus(attr, 'CHANGED');
            attr.components = updatedComponents;
        },
        editAttribute: (state, action)=>{
            const { name, attributeToSet, forTarget, targetUid } = action.payload;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            const initialAttributeIndex = findAttributeIndex(type, name);
            if (initialAttributeIndex === -1) {
                return;
            }
            const previousAttribute = type.attributes[initialAttributeIndex];
            setAttributeAt(type, initialAttributeIndex, attributeToSet);
            if (previousAttribute.type !== attributeToSet.type) {
                return;
            }
            if (previousAttribute.type !== 'relation' || attributeToSet.type !== 'relation') {
                return;
            }
            const previousTarget = getType(state, {
                forTarget: 'contentType',
                targetUid: previousAttribute.target
            });
            const newTarget = getType(state, {
                forTarget: 'contentType',
                targetUid: attributeToSet.target
            });
            const previousTargetAttributeIndex = findAttributeIndex(previousTarget, previousAttribute.targetAttribute ?? '');
            // remove old targetAttribute
            if (previousAttribute.targetAttribute) {
                removeAttributeByName(previousTarget, previousAttribute.targetAttribute);
            }
            const newRelationType = getRelationType(attributeToSet.relation, attributeToSet.targetAttribute);
            const isBidirectionnal = !ONE_SIDE_RELATIONS.includes(newRelationType);
            if (isBidirectionnal) {
                const newTargetAttribute = {
                    name: attributeToSet.targetAttribute,
                    type: 'relation',
                    relation: getOppositeRelation(attributeToSet.relation),
                    targetAttribute: attributeToSet.name,
                    target: type.uid,
                    private: previousAttribute.private ?? attributeToSet.private,
                    pluginOptions: previousAttribute.pluginOptions ?? attributeToSet.pluginOptions,
                    status: 'CHANGED'
                };
                // create or recreate(at old index) targetAttribute
                if (previousTargetAttributeIndex !== -1 && previousTarget.uid === newTarget.uid) {
                    // re-create at previousIdx if possible
                    replaceAttributeAt(newTarget, previousTargetAttributeIndex, newTargetAttribute);
                } else {
                    pushAttribute(newTarget, {
                        ...newTargetAttribute,
                        status: 'NEW'
                    });
                }
            }
        },
        editCustomFieldAttribute: (state, action)=>{
            const { forTarget, targetUid, name, attributeToSet } = action.payload;
            const initialAttributeName = name;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            const initialAttributeIndex = findAttributeIndex(type, initialAttributeName);
            setAttributeAt(type, initialAttributeIndex, attributeToSet);
        },
        reloadPlugin: ()=>{
            return initialState;
        },
        removeComponentFromDynamicZone: (state, action)=>{
            const { dzName, componentToRemoveIndex, forTarget, targetUid } = action.payload;
            const type = forTarget === 'contentType' ? state.contentTypes[targetUid] : state.components[targetUid];
            if (!type) {
                return;
            }
            const dzAttributeIndex = findAttributeIndex(type, dzName);
            const attr = type.attributes[dzAttributeIndex];
            setStatus(type, 'CHANGED');
            setAttributeStatus(attr, 'CHANGED');
            attr.components.splice(componentToRemoveIndex, 1);
        },
        removeField: (state, action)=>{
            const { forTarget, targetUid, attributeToRemoveName } = action.payload;
            const type = getType(state, {
                forTarget,
                targetUid
            });
            const attributeToRemoveIndex = findAttributeIndex(type, attributeToRemoveName);
            const attribute = type.attributes[attributeToRemoveIndex];
            if (attribute.type === 'relation') {
                const { target, relation, targetAttribute: targetAttributeName } = attribute;
                const relationType = getRelationType(relation, targetAttributeName);
                const isBidirectionnal = !ONE_SIDE_RELATIONS.includes(relationType);
                if (isBidirectionnal && targetAttributeName) {
                    const targetContentType = getType(state, {
                        forTarget,
                        targetUid: target
                    });
                    const targetAttributeIndex = findAttributeIndex(targetContentType, targetAttributeName);
                    removeAttributeAt(targetContentType, targetAttributeIndex);
                }
            }
            // Find all uid fields that have the targetField set to the field we are removing
            type.attributes.forEach((attribute)=>{
                if (attribute.type === 'uid') {
                    if (attribute.targetField === attributeToRemoveName) {
                        delete attribute.targetField;
                    }
                }
            });
            removeAttributeAt(type, attributeToRemoveIndex);
        },
        // only edits a component in practice
        updateComponentSchema: (state, action)=>{
            const { data, uid } = action.payload;
            const type = state.components[uid];
            if (!type) {
                return;
            }
            updateType(type, {
                info: {
                    displayName: data.displayName,
                    icon: data.icon
                }
            });
        },
        updateComponentUid: (state, action)=>{
            const { newComponentUID, uid } = action.payload;
            const type = state.components[uid];
            if (!type || type.status !== 'NEW') {
                return;
            }
            if (newComponentUID !== uid) {
                const newType = {
                    ...type,
                    uid: newComponentUID
                };
                state.components[newComponentUID] = newType;
                delete state.components[uid];
                // update the uid in the content types
                Object.keys(state.contentTypes).forEach((contentTypeUid)=>{
                    const contentType = state.contentTypes[contentTypeUid];
                    contentType.attributes.forEach((attribute)=>{
                        if (attribute.type === 'dynamiczone') {
                            const newComponents = attribute.components.map((component)=>{
                                if (component === uid) {
                                    return newComponentUID;
                                }
                                return component;
                            });
                            attribute.components = newComponents;
                        }
                    });
                    contentType.attributes.forEach((attribute)=>{
                        if (attribute.type === 'component' && attribute.component === uid) {
                            attribute.component = newComponentUID;
                        }
                    });
                });
                // update the uid in the other components
                Object.keys(state.components).forEach((componentUid)=>{
                    const component = state.components[componentUid];
                    component.attributes.forEach((attribute)=>{
                        if (attribute.type === 'component' && attribute.component === uid) {
                            attribute.component = newComponentUID;
                        }
                    });
                });
            }
        },
        updateSchema: (state, action)=>{
            const { data, uid } = action.payload;
            const { displayName, kind, draftAndPublish, pluginOptions } = data;
            const type = state.contentTypes[uid];
            if (!type) {
                return;
            }
            updateType(type, {
                info: {
                    displayName
                },
                kind,
                options: {
                    draftAndPublish
                },
                pluginOptions
            });
        },
        deleteComponent: (state, action)=>{
            const uid = action.payload;
            // remove the compo from the components
            if (state.components[uid].status === 'NEW') {
                delete state.components[uid];
            } else {
                setStatus(state.components[uid], 'REMOVED');
            }
            // remove the compo from the content types
            Object.keys(state.contentTypes).forEach((contentTypeUid)=>{
                const contentType = state.contentTypes[contentTypeUid];
                // remove from dynamic zones
                contentType.attributes.forEach((attribute)=>{
                    if (attribute.type === 'dynamiczone') {
                        const newComponents = attribute.components.filter((component)=>component !== uid);
                        attribute.components = newComponents;
                    }
                });
                contentType.attributes.forEach((attribute)=>{
                    if (attribute.type === 'component' && attribute.component === uid) {
                        removeAttributeByName(contentType, attribute.name);
                    }
                });
            });
            // remove the compo from other components
            Object.keys(state.components).forEach((componentUid)=>{
                const component = state.components[componentUid];
                component.attributes.forEach((attribute)=>{
                    if (attribute.type === 'component' && attribute.component === uid) {
                        removeAttributeByName(component, attribute.name);
                    }
                });
            });
        },
        deleteContentType: (state, action)=>{
            const uid = action.payload;
            const type = state.contentTypes[uid];
            // just drop new content types
            if (type.status === 'NEW') {
                delete state.contentTypes[uid];
            } else {
                setStatus(type, 'REMOVED');
            }
            // remove the content type from the components
            Object.keys(state.components).forEach((componentUid)=>{
                const component = state.components[componentUid];
                component.attributes.forEach((attribute)=>{
                    if (attribute.type === 'relation' && attribute.target === uid) {
                        removeAttributeByName(component, attribute.name);
                    }
                });
            });
            // remove the content type from the content types
            Object.keys(state.contentTypes).forEach((contentTypeUid)=>{
                const contentType = state.contentTypes[contentTypeUid];
                contentType.attributes.forEach((attribute)=>{
                    if (attribute.type === 'relation' && attribute.target === uid) {
                        removeAttributeByName(contentType, attribute.name);
                    }
                });
            });
        },
        applyChange (state, reducerAction) {
            const { action, schema } = reducerAction.payload;
            switch(action){
                case 'add':
                    {
                        const uid = schema.uid;
                        if (schema.modelType === 'component') {
                            state.components[uid] = schema;
                        } else {
                            state.contentTypes[uid] = schema;
                        }
                    }
                    break;
                case 'update':
                    {
                        const uid = schema.uid;
                        // Find the schema, if the state was "create", we should keep it as it was before
                        if (schema.modelType === 'component') {
                            const component = state.components[uid];
                            state.components[uid] = {
                                ...schema,
                                status: component?.status === 'NEW' ? 'NEW' : schema.status
                            };
                        } else {
                            const contentType = state.contentTypes[uid];
                            state.contentTypes[uid] = {
                                ...schema,
                                status: contentType?.status === 'NEW' ? 'NEW' : schema.status
                            };
                        }
                    }
                    break;
                case 'delete':
                    {
                        const uid = schema.uid;
                        const isComponent = schema.modelType === 'component';
                        // It's a component that has yet not been added
                        if (isComponent) {
                            const exists = state.components[uid];
                            if (!exists) {
                                return;
                            }
                            const isUnsaved = state.components[uid]?.status === 'NEW';
                            if (isUnsaved) {
                                delete state.components[uid];
                            } else {
                                state.components[uid].status = 'REMOVED';
                            }
                        } else {
                            const exists = state.contentTypes[uid];
                            if (!exists) {
                                return;
                            }
                            const isUnsaved = state.contentTypes[uid]?.status === 'NEW';
                            if (isUnsaved) {
                                delete state.contentTypes[uid];
                            } else {
                                state.contentTypes[uid].status = 'REMOVED';
                            }
                        }
                        break;
                    }
            }
        }
    }
}, {
    limit: 50,
    excludeActionsFromHistory: [
        'reloadPlugin',
        'init'
    ],
    stateSelector: (state)=>{
        if (!state) {
            return {};
        }
        return {
            components: state.components,
            contentTypes: state.contentTypes
        };
    },
    discard: (state)=>{
        state.components = state.initialComponents;
        state.contentTypes = state.initialContentTypes;
    }
});
const { reducer, actions } = slice;

export { actions, initialState, reducer };
//# sourceMappingURL=reducer.mjs.map
