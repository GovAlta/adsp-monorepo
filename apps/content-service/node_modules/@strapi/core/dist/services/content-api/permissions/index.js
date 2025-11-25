'use strict';

var _ = require('lodash');
var action = require('./providers/action.js');
var condition = require('./providers/condition.js');
var engine = require('./engine.js');

const typeSymbol = Symbol.for('__type__');
/**
 * Creates a handler that checks if the permission's action exists in the action registry
 */ const createValidatePermissionHandler = (actionProvider)=>({ permission })=>{
        const action = actionProvider.get(permission.action);
        // If the action isn't registered into the action provider, then ignore the permission and warn the user
        if (!action) {
            strapi.log.debug(`Unknown action "${permission.action}" supplied when registering a new permission`);
            return false;
        }
        return true;
    };
/**
 * Create instances of providers and permission engine for the core content-API service.
 * Also, expose utilities to get information about available actions and such.
 */ var instantiatePermissionsUtilities = ((strapi1)=>{
    // NOTE: Here we define both an action and condition provider,
    // but at the moment, we're only using the action one.
    const providers = {
        action: action(),
        condition: condition()
    };
    /**
   * Get a tree representation of the available Content API actions
   * based on the methods of the Content API controllers.
   *
   * @note Only actions bound to a content-API route are returned.
   */ const getActionsMap = ()=>{
        const actionMap = {};
        /**
     * Check if a controller's action is bound to the
     * content-api by looking at a potential __type__ symbol
     */ const isContentApi = (action)=>{
            if (!_.has(action, typeSymbol)) {
                return false;
            }
            return action[typeSymbol].includes('content-api');
        };
        /**
     * Register actions from a specific API source into the result tree
     */ const registerAPIsActions = (apis, source)=>{
            _.forEach(apis, (api, apiName)=>{
                const controllers = _.reduce(api.controllers, (acc, controller, controllerName)=>{
                    const contentApiActions = _.pickBy(controller, isContentApi);
                    if (_.isEmpty(contentApiActions)) {
                        return acc;
                    }
                    acc[controllerName] = Object.keys(contentApiActions);
                    return acc;
                }, {});
                if (!_.isEmpty(controllers)) {
                    actionMap[`${source}::${apiName}`] = {
                        controllers
                    };
                }
            });
        };
        registerAPIsActions(strapi1.apis, 'api');
        registerAPIsActions(strapi1.plugins, 'plugin');
        return actionMap;
    };
    /**
   * Register all the content-API controllers actions into the action provider.
   * This method make use of the {@link getActionsMap} to generate the list of actions to register.
   */ const registerActions = async ()=>{
        const actionsMap = getActionsMap();
        // For each API
        for (const [api, value] of Object.entries(actionsMap)){
            const { controllers } = value;
            // Register controllers methods as actions
            for (const [controller, actions] of Object.entries(controllers)){
                // Register each action individually
                await Promise.all(actions.map((action)=>{
                    const actionUID = `${api}.${controller}.${action}`;
                    return providers.action.register(actionUID, {
                        api,
                        controller,
                        action,
                        uid: actionUID
                    });
                }));
            }
        }
    };
    // Create an instance of a content-API permission engine
    // and binds a custom validation handler to it
    const engine$1 = engine({
        providers
    });
    engine$1.on('before-format::validate.permission', createValidatePermissionHandler(providers.action));
    return {
        engine: engine$1,
        providers,
        registerActions,
        getActionsMap
    };
});

module.exports = instantiatePermissionsUtilities;
//# sourceMappingURL=index.js.map
