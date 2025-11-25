import _ from 'lodash/fp';
import qs from 'qs';
import { createWillRegisterContext, createEngineHooks, createBeforeEvaluateContext, createValidateContext } from './hooks.mjs';
import * as index from './abilities/index.mjs';
export { index as abilities };
import { caslAbilityBuilder } from './abilities/casl-ability.mjs';

/**
 * Create a default state object for the engine
 */ const createEngineState = ()=>{
    const hooks = createEngineHooks();
    return {
        hooks
    };
};
const newEngine = (params)=>{
    const { providers, abilityBuilderFactory = caslAbilityBuilder } = params;
    const state = createEngineState();
    const runValidationHook = async (hook, context)=>state.hooks[hook].call(context);
    /**
   * Evaluate a permission using local and registered behaviors (using hooks).
   * Validate, format (add condition, etc...), evaluate (evaluate conditions) and register a permission
   */ const evaluate = async (params)=>{
        const { options, register } = params;
        const preFormatValidation = await runValidationHook('before-format::validate.permission', createBeforeEvaluateContext(params.permission));
        if (preFormatValidation === false) {
            return;
        }
        const permission = await state.hooks['format.permission'].call(params.permission);
        const afterFormatValidation = await runValidationHook('after-format::validate.permission', createValidateContext(permission));
        if (afterFormatValidation === false) {
            return;
        }
        await state.hooks['before-evaluate.permission'].call(createBeforeEvaluateContext(permission));
        const { action: actionName, subject, properties, conditions = [], actionParameters = {} } = permission;
        let action = actionName;
        if (actionParameters && Object.keys(actionParameters).length > 0) {
            action = `${actionName}?${qs.stringify(actionParameters)}`;
        }
        if (conditions.length === 0) {
            return register({
                action,
                subject,
                properties
            });
        }
        const resolveConditions = _.map(providers.condition.get);
        const removeInvalidConditions = _.filter((condition)=>_.isFunction(condition.handler));
        const evaluateConditions = (conditions)=>{
            return Promise.all(conditions.map(async (condition)=>({
                    condition,
                    result: await condition.handler(_.merge(options, {
                        permission: _.cloneDeep(permission)
                    }))
                })));
        };
        const removeInvalidResults = _.filter(({ result })=>_.isBoolean(result) || _.isObject(result));
        const evaluatedConditions = await Promise.resolve(conditions).then(resolveConditions).then(removeInvalidConditions).then(evaluateConditions).then(removeInvalidResults);
        const resultPropEq = _.propEq('result');
        const pickResults = _.map(_.prop('result'));
        if (evaluatedConditions.every(resultPropEq(false))) {
            return;
        }
        if (_.isEmpty(evaluatedConditions) || evaluatedConditions.some(resultPropEq(true))) {
            return register({
                action,
                subject,
                properties
            });
        }
        const results = pickResults(evaluatedConditions).filter(_.isObject);
        if (_.isEmpty(results)) {
            return register({
                action,
                subject,
                properties
            });
        }
        return register({
            action,
            subject,
            properties,
            condition: {
                $and: [
                    {
                        $or: results
                    }
                ]
            }
        });
    };
    return {
        get hooks () {
            return state.hooks;
        },
        /**
     * Create a register function that wraps a `can` function
     * used to register a permission in the ability builder
     */ createRegisterFunction (can, options) {
            return async (permission)=>{
                const hookContext = createWillRegisterContext({
                    options,
                    permission
                });
                await state.hooks['before-register.permission'].call(hookContext);
                return can(permission);
            };
        },
        /**
     * Register a new handler for a given hook
     */ on (hook, handler) {
            const validHooks = Object.keys(state.hooks);
            const isValidHook = validHooks.includes(hook);
            if (!isValidHook) {
                throw new Error(`Invalid hook supplied when trying to register an handler to the permission engine. Got "${hook}" but expected one of ${validHooks.join(', ')}`);
            }
            state.hooks[hook].register(handler);
            return this;
        },
        /**
     * Generate an ability based on the instance's
     * ability builder and the given permissions
     */ async generateAbility (permissions, options = {}) {
            const { can, build } = abilityBuilderFactory();
            for (const permission of permissions){
                const register = this.createRegisterFunction(can, options);
                await evaluate({
                    permission,
                    options,
                    register
                });
            }
            return build();
        }
    };
};

export { newEngine as new };
//# sourceMappingURL=index.mjs.map
