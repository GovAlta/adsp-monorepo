'use strict';

var utils = require('@strapi/utils');
var actionProvider = require('../../validation/action-provider.js');
var index = require('./index.js');

const { ApplicationError } = utils.errors;
/**
 * Creates a new instance of an action provider
 */ const createActionProvider = (options)=>{
    const provider = utils.providerFactory(options);
    const actionHooks = {
        appliesPropertyToSubject: utils.hooks.createAsyncParallelHook()
    };
    return {
        ...provider,
        hooks: {
            ...provider.hooks,
            ...actionHooks
        },
        async register (actionAttributes) {
            if (strapi.isLoaded) {
                throw new Error(`You can't register new actions outside of the bootstrap function.`);
            }
            actionProvider.validateRegisterProviderAction([
                actionAttributes
            ]);
            const action = index.create(actionAttributes);
            return provider.register(action.actionId, action);
        },
        async registerMany (actionsAttributes) {
            actionProvider.validateRegisterProviderAction(actionsAttributes);
            for (const attributes of actionsAttributes){
                await this.register(attributes);
            }
            return this;
        },
        async appliesToProperty (property, actionId, subject) {
            const action = provider.get(actionId);
            if (!action) {
                throw new ApplicationError(`No action found with id "${actionId}"`);
            }
            const appliesToAction = index.appliesToProperty(property, action);
            // If the property isn't valid for this action, ignore the rest of the checks
            if (!appliesToAction) {
                return false;
            }
            // If the property is valid for this action and there isn't any subject
            if (!subject) {
                return true;
            }
            // If the property is valid for this action and the subject is not handled by the action
            if (!index.appliesToSubject(subject, action)) {
                return false;
            }
            const results = await actionHooks.appliesPropertyToSubject.call({
                property,
                action,
                subject
            });
            return results.every((result)=>result !== false);
        },
        /**
     * @experimental
     */ unstable_aliases (actionId, subject) {
            const isRegistered = this.has(actionId);
            if (!isRegistered) {
                return [];
            }
            return this.values().filter((action)=>action.aliases?.some((alias)=>{
                    // Only look at alias with the correct actionId
                    if (alias.actionId !== actionId) {
                        return false;
                    }
                    // If the alias don't have a list of required subjects, keep it
                    if (!Array.isArray(alias.subjects)) {
                        return true;
                    }
                    // If the alias require specific subjects but none is provided, skip it
                    if (!subject) {
                        return false;
                    }
                    // Else, make sure the given subject is allowed
                    return alias.subjects.includes(subject);
                })).map((action)=>action.actionId);
        }
    };
};

module.exports = createActionProvider;
//# sourceMappingURL=provider.js.map
