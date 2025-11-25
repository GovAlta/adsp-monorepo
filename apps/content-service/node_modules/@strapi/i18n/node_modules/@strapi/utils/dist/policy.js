'use strict';

var fp = require('lodash/fp');

const createPolicy = (options)=>{
    const { name = 'unnamed', validator, handler } = options;
    const wrappedValidator = (config)=>{
        if (validator) {
            try {
                validator(config);
            } catch (e) {
                throw new Error(`Invalid config passed to "${name}" policy.`);
            }
        }
    };
    return {
        name,
        validator: wrappedValidator,
        handler
    };
};
const createPolicyContext = (type, ctx)=>{
    return Object.assign({
        is: fp.eq(type),
        get type () {
            return type;
        }
    }, ctx);
};

exports.createPolicy = createPolicy;
exports.createPolicyContext = createPolicyContext;
//# sourceMappingURL=policy.js.map
