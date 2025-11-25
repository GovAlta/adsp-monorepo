// lodash/fp curry does not handle async functions properly, and creates very "ugly" types,
// so we will use our own version to ensure curried functions are typed correctly
// TODO: Export this from root @strapi/utils so we don't have copies of it between packages
/**
 * @internal
 */ const asyncCurry = (fn)=>{
    const curried = (...args)=>{
        if (args.length >= fn.length) {
            return fn(...args);
        }
        return (...moreArgs)=>curried(...args, ...moreArgs);
    };
    return curried;
};

export { asyncCurry };
//# sourceMappingURL=async-curry.mjs.map
