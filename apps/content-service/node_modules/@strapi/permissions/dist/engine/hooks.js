'use strict';

var _ = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../domain/permission/index.js');

/**
 * Create a hook map used by the permission Engine
 */ const createEngineHooks = ()=>({
        'before-format::validate.permission': utils.hooks.createAsyncBailHook(),
        'format.permission': utils.hooks.createAsyncSeriesWaterfallHook(),
        'after-format::validate.permission': utils.hooks.createAsyncBailHook(),
        'before-evaluate.permission': utils.hooks.createAsyncSeriesHook(),
        'before-register.permission': utils.hooks.createAsyncSeriesHook()
    });
/**
 * Create a context from a domain {@link Permission} used by the validate hooks
 */ const createValidateContext = (permission)=>({
        get permission () {
            return _.cloneDeep(permission);
        }
    });
/**
 * Create a context from a domain {@link Permission} used by the before valuate hook
 */ const createBeforeEvaluateContext = (permission)=>({
        get permission () {
            return _.cloneDeep(permission);
        },
        addCondition (condition) {
            Object.assign(permission, index.addCondition(condition, permission));
            return this;
        }
    });
/**
 * Create a context from a casl Permission & some options
 * @param caslPermission
 */ const createWillRegisterContext = ({ permission, options })=>({
        ...options,
        get permission () {
            return _.cloneDeep(permission);
        },
        condition: {
            and (rawConditionObject) {
                if (!permission.condition) {
                    permission.condition = {
                        $and: []
                    };
                }
                if (_.isArray(permission.condition.$and)) {
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
                if (_.isArray(permission.condition.$and)) {
                    const orClause = permission.condition.$and.find(_.has('$or'));
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

exports.createBeforeEvaluateContext = createBeforeEvaluateContext;
exports.createEngineHooks = createEngineHooks;
exports.createValidateContext = createValidateContext;
exports.createWillRegisterContext = createWillRegisterContext;
//# sourceMappingURL=hooks.js.map
