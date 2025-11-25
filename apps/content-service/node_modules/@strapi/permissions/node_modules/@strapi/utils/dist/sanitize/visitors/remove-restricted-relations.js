'use strict';

var fp = require('lodash/fp');
var contentTypes = require('../../content-types.js');
var relations = require('../../relations.js');

const ACTIONS_TO_VERIFY = [
    'find'
];
const { CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = contentTypes.constants;
var removeRestrictedRelations = ((auth)=>async ({ data, key, attribute, schema }, { remove, set })=>{
        if (!attribute) {
            return;
        }
        const isRelation = attribute.type === 'relation';
        if (!isRelation) {
            return;
        }
        const handleMorphRelation = async ()=>{
            const elements = data[key];
            if (!elements) {
                return;
            }
            if ('connect' in elements || 'set' in elements || 'disconnect' in elements) {
                const newValue = {};
                const connect = await handleMorphElements(elements.connect || []);
                const relSet = await handleMorphElements(elements.set || []);
                const disconnect = await handleMorphElements(elements.disconnect || []);
                if (connect.length > 0) {
                    newValue.connect = connect;
                }
                if (relSet.length > 0) {
                    newValue.set = relSet;
                }
                if (disconnect.length > 0) {
                    newValue.disconnect = disconnect;
                }
                // TODO: this should technically be in its own visitor to check morph options, but for now we'll handle it here
                if ('options' in elements && typeof elements.options === 'object' && elements.options !== null) {
                    const filteredOptions = {};
                    // Iterate through the keys of elements.options
                    Object.keys(elements.options).forEach((key)=>{
                        const validator = relations.VALID_RELATION_ORDERING_KEYS[key];
                        // Ensure the key exists in VALID_RELATION_ORDERING_KEYS and the validator is defined before calling it
                        if (validator && validator(elements.options[key])) {
                            filteredOptions[key] = elements.options[key];
                        }
                    });
                    // Assign the filtered options back to newValue
                    newValue.options = filteredOptions;
                } else {
                    newValue.options = {};
                }
                set(key, newValue);
            } else {
                const newMorphValue = await handleMorphElements(elements);
                if (newMorphValue.length) {
                    set(key, newMorphValue);
                }
            }
        };
        const handleMorphElements = async (elements)=>{
            const allowedElements = [];
            if (!fp.isArray(elements)) {
                return allowedElements;
            }
            for (const element of elements){
                if (!fp.isObject(element) || !('__type' in element)) {
                    continue;
                }
                const scopes = ACTIONS_TO_VERIFY.map((action)=>`${element.__type}.${action}`);
                const isAllowed = await hasAccessToSomeScopes(scopes, auth);
                if (isAllowed) {
                    allowedElements.push(element);
                }
            }
            return allowedElements;
        };
        const handleRegularRelation = async ()=>{
            const scopes = ACTIONS_TO_VERIFY.map((action)=>`${attribute.target}.${action}`);
            const isAllowed = await hasAccessToSomeScopes(scopes, auth);
            // If the authenticated user don't have access to any of the scopes, then remove the field
            if (!isAllowed) {
                remove(key);
            }
        };
        const isCreatorRelation = [
            CREATED_BY_ATTRIBUTE,
            UPDATED_BY_ATTRIBUTE
        ].includes(key);
        // Polymorphic relations
        if (contentTypes.isMorphToRelationalAttribute(attribute)) {
            await handleMorphRelation();
            return;
        }
        // Creator relations
        if (isCreatorRelation && schema.options?.populateCreatorFields) {
            // do nothing
            return;
        }
        // Regular relations
        await handleRegularRelation();
    });
const hasAccessToSomeScopes = async (scopes, auth)=>{
    for (const scope of scopes){
        try {
            await strapi.auth.verify(auth, {
                scope
            });
            return true;
        } catch  {
            continue;
        }
    }
    return false;
};

module.exports = removeRestrictedRelations;
//# sourceMappingURL=remove-restricted-relations.js.map
