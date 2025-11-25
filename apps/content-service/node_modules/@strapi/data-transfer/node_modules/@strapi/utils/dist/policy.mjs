import { eq } from 'lodash/fp';

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
        is: eq(type),
        get type () {
            return type;
        }
    }, ctx);
};

export { createPolicy, createPolicyContext };
//# sourceMappingURL=policy.mjs.map
