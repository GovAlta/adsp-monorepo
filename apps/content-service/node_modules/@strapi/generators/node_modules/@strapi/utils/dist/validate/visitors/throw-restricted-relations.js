'use strict';

var fp = require('lodash/fp');
var contentTypes = require('../../content-types.js');
var utils = require('../utils.js');
var relations = require('../../relations.js');

const ACTIONS_TO_VERIFY = [
    'find'
];
const { CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = contentTypes.constants;
var throwRestrictedRelations = ((auth)=>async ({ data, key, attribute, schema, path })=>{
        if (!attribute) {
            return;
        }
        const isRelation = attribute.type === 'relation';
        if (!isRelation) {
            return;
        }
        const handleMorphRelation = async ()=>{
            const elements = data[key];
            if ('connect' in elements || 'set' in elements || 'disconnect' in elements || 'options' in elements) {
                await handleMorphElements(elements.connect || []);
                await handleMorphElements(elements.set || []);
                await handleMorphElements(elements.disconnect || []);
                // TODO: this should technically be in its own visitor to check morph options, but for now we'll handle it here
                if ('options' in elements) {
                    if (elements.options === null || elements.options === undefined) {
                        return;
                    }
                    if (typeof elements.options !== 'object') {
                        utils.throwInvalidKey({
                            key,
                            path: path.attribute
                        });
                    }
                    const optionKeys = Object.keys(elements.options);
                    // Validate each key based on its validator function
                    for (const key of optionKeys){
                        if (!(key in relations.VALID_RELATION_ORDERING_KEYS)) {
                            utils.throwInvalidKey({
                                key,
                                path: path.attribute
                            });
                        }
                        if (!relations.VALID_RELATION_ORDERING_KEYS[key](elements.options[key])) {
                            utils.throwInvalidKey({
                                key,
                                path: path.attribute
                            });
                        }
                    }
                }
            } else {
                await handleMorphElements(elements);
            }
        };
        const handleMorphElements = async (elements)=>{
            if (!fp.isArray(elements)) {
                utils.throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
            for (const element of elements){
                if (!fp.isObject(element) || !('__type' in element)) {
                    utils.throwInvalidKey({
                        key,
                        path: path.attribute
                    });
                }
                const scopes = ACTIONS_TO_VERIFY.map((action)=>`${element.__type}.${action}`);
                const isAllowed = await hasAccessToSomeScopes(scopes, auth);
                if (!isAllowed) {
                    utils.throwInvalidKey({
                        key,
                        path: path.attribute
                    });
                }
            }
        };
        const handleRegularRelation = async ()=>{
            const scopes = ACTIONS_TO_VERIFY.map((action)=>`${attribute.target}.${action}`);
            const isAllowed = await hasAccessToSomeScopes(scopes, auth);
            // If the authenticated user don't have access to any of the scopes
            if (!isAllowed) {
                utils.throwInvalidKey({
                    key,
                    path: path.attribute
                });
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

module.exports = throwRestrictedRelations;
//# sourceMappingURL=throw-restricted-relations.js.map
