'use strict';

var errors = require('../errors.js');

// lodash/fp curry does not handle async functions properly, and creates very "ugly" types,
// so we will use our own version to ensure curried functions are typed correctly
// TODO: Export this from root @strapi/utils so we don't have copies of it between packages
const throwInvalidKey = ({ key, path })=>{
    const msg = path && path !== key ? `Invalid key ${key} at ${path}` : `Invalid key ${key}`;
    throw new errors.ValidationError(msg, {
        key,
        path
    });
};
const asyncCurry = (fn)=>{
    const curried = (...args)=>{
        if (args.length >= fn.length) {
            return fn(...args);
        }
        return (...moreArgs)=>curried(...args, ...moreArgs);
    };
    return curried;
};

exports.asyncCurry = asyncCurry;
exports.throwInvalidKey = throwInvalidKey;
//# sourceMappingURL=utils.js.map
