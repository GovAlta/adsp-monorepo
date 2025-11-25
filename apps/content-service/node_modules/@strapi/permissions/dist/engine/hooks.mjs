import { cloneDeep, isArray, has } from 'lodash/fp';
import { hooks } from '@strapi/utils';
import { addCondition } from '../domain/permission/index.mjs';

/**
 * Create a hook map used by the permission Engine
 */ const createEngineHooks = ()=>({
        'before-format::validate.permission': hooks.createAsyncBailHook(),
        'format.permission': hooks.createAsyncSeriesWaterfallHook(),
        'after-format::validate.permission': hooks.createAsyncBailHook(),
        'before-evaluate.permission': hooks.createAsyncSeriesHook(),
        'before-register.permission': hooks.createAsyncSeriesHook()
    });
/**
 * Create a context from a domain {@link Permission} used by the validate hooks
 */ const createValidateContext = (permission)=>({
        get permission () {
            return cloneDeep(permission);
        }
    });
/**
 * Create a context from a domain {@link Permission} used by the before valuate hook
 */ const createBeforeEvaluateContext = (permission)=>({
        get permission () {
            return cloneDeep(permission);
        },
        addCondition (condition) {
            Object.assign(permission, addCondition(condition, permission));
            return this;
        }
    });
/**
 * Create a context from a casl Permission & some options
 * @param caslPermission
 */ const createWillRegisterContext = ({ permission, options })=>({
        ...options,
        get permission () {
            return cloneDeep(permission);
        },
        condition: {
            and (rawConditionObject) {
                if (!permission.condition) {
                    permission.condition = {
                        $and: []
                    };
                }
                if (isArray(permission.condition.$and)) {
                    permission.condition.$and.push(rawConditionObject);
                }
                return this;
            },
            or (rawConditionObject) {
                if (!permission.condition) {
                    permission.condition = {
                        $and: []
                    };
                }
                if (isArray(permission.condition.$and)) {
                    const orClause = permission.condition.$and.find(has('$or'));
                    if (orClause) {
                        orClause.$or.push(rawConditionObject);
                    } else {
                        permission.condition.$and.push({
                            $or: [
                                rawConditionObject
                            ]
                        });
                    }
                }
                return this;
            }
        }
    });

export { createBeforeEvaluateContext, createEngineHooks, createValidateContext, createWillRegisterContext };
//# sourceMappingURL=hooks.mjs.map
