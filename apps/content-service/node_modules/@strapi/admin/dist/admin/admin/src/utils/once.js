'use strict';

const once = (fn)=>{
    const func = fn;
    let called = false;
    if (typeof func !== 'function') {
        throw new TypeError(`once requires a function parameter`);
    }
    return (...args)=>{
        if (!called && process.env.NODE_ENV === 'development') {
            func(...args);
            called = true;
        }
    };
};

exports.once = once;
//# sourceMappingURL=once.js.map
