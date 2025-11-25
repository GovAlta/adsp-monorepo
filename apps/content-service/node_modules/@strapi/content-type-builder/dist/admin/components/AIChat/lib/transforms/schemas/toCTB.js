'use strict';

var isEqual = require('lodash/isEqual');
var omit = require('lodash/omit');
var pluralize = require('pluralize');

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
const ACTION_TO_STATUS = {
    create: 'NEW',
    remove: 'REMOVED',
    update: 'CHANGED'
};
/**
 * Creates a new attribute with the specified status
 */ const createAttributeWithStatus = (name, attributeData, status)=>({
        ...attributeData,
        name,
        status
    });
/**
 * Determines the status of an attribute by comparing new and old versions
 */ const determineAttributeStatus = (newAttr, oldAttr, oldSchema)=>{
    if (!oldAttr) {
        return 'NEW';
    }
    // If the schema was already new, don't mark attributes as changed, keep them as new.
    if (oldSchema?.status === 'NEW') {
        return 'NEW';
    }
    // Compare attributes without the status field to determine if they've changed
    const newAttrWithoutStatus = omit(newAttr, [
        'status'
    ]);
    const oldAttrWithoutStatus = omit(oldAttr, [
        'status'
    ]);
    if (!isEqual(newAttrWithoutStatus, oldAttrWithoutStatus)) {
        return 'CHANGED';
    }
    // If unchanged, keep the previous status
    return oldAttr.status;
};
/**
 * Determines the status of a schema by comparing action and checking if oldSchema exists
 */ const transformStatusFromChatToCTB = (schema, oldSchema)=>{
    // If schema has an action, use the mapped status
    if (schema.action) {
        return ACTION_TO_STATUS[schema.action];
    }
    // If oldSchema doesn't exist, it's a new schema
    if (!oldSchema) {
        return 'NEW';
    }
    // If no action is specified and oldSchema exists, keep the existing status
    return oldSchema.status;
};
/**
 * Transform attributes from Chat format to CTB format
 * Also performs a diff to determine the status of each attribute
 */ const transformAttributesFromChatToCTB = ({ action, attributes }, oldSchema)=>{
    // If it's a new schema or no oldAttributes provided, all attributes are NEW
    if (action === 'create' || !oldSchema) {
        return Object.entries(attributes).map(([name, attribute])=>createAttributeWithStatus(name, attribute, 'NEW'));
    }
    // Convert old attributes array to a lookup map for faster access
    const oldAttributesMap = oldSchema.attributes.reduce((acc, attr)=>({
            ...acc,
            [attr.name]: attr
        }), {});
    // Process current attributes (new and changed)
    const processedAttributes = Object.entries(attributes).map(([name, attr])=>{
        const oldAttr = oldAttributesMap[name];
        const status = determineAttributeStatus({
            ...attr,
            name
        }, oldAttr, oldSchema);
        return createAttributeWithStatus(name, attr, status);
    });
    // No need to mark removed attributes if the old schema is new, just remove it from the list
    // TODO: Else a validation error occurs on the backend side.
    if (oldSchema?.status === 'NEW') {
        return processedAttributes;
    }
    // Find removed attributes (exist in old but not in new)
    const removedAttributes = Object.entries(oldAttributesMap).filter(([name])=>!attributes[name]).map(([name, oldAttr])=>createAttributeWithStatus(name, oldAttr, 'REMOVED'));
    // Combine both sets of attributes
    return [
        ...processedAttributes,
        ...removedAttributes
    ];
};
/**
 * Transform schema format
 *  AI chat -> CTB
 *
 * The AI chat returns a simplified format, and this layer transforms it to be compatible with the CTB reducer.
 *
 * We need to keep track of which changes have been made
 */ const transformChatToCTB = (schema, oldSchema)=>{
    const singularName = pluralize.singular(schema.name).toLowerCase().replace(/ /g, '-');
    const pluralName = pluralize.plural(schema.name).toLowerCase().replace(/ /g, '-');
    if (schema.modelType === 'component') {
        return {
            category: schema.category || 'default',
            modelName: singularName,
            attributes: transformAttributesFromChatToCTB(schema, oldSchema),
            info: {
                displayName: schema.name,
                description: schema.description
            },
            modelType: schema.modelType,
            uid: schema.uid,
            collectionName: pluralName,
            status: transformStatusFromChatToCTB(schema, oldSchema),
            globalId: singularName
        };
    }
    return {
        uid: schema.uid,
        modelType: schema.modelType,
        modelName: singularName,
        kind: schema.kind,
        info: {
            displayName: schema.name.charAt(0).toUpperCase() + schema.name.slice(1),
            // Always keep the old by default
            // @ts-expect-error - not in types
            singularName: oldSchema?.info?.singularName || singularName,
            // Always keep the old by default
            // @ts-expect-error - not in types
            pluralName: oldSchema?.info?.pluralName || pluralName
        },
        collectionName: pluralName,
        attributes: transformAttributesFromChatToCTB(schema, oldSchema),
        options: {
            draftAndPublish: schema.options?.draftAndPublish ?? false
        },
        pluginOptions: {
            i18n: {
                localized: schema.options?.localized ?? false
            }
        },
        visible: true,
        status: transformStatusFromChatToCTB(schema, oldSchema),
        globalId: singularName,
        restrictRelationsTo: null
    };
};

exports.transformAttributesFromChatToCTB = transformAttributesFromChatToCTB;
exports.transformChatToCTB = transformChatToCTB;
//# sourceMappingURL=toCTB.js.map
