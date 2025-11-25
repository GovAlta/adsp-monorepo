const wrapInTransaction = (fn)=>{
    return (...args)=>strapi.db.transaction?.(()=>fn(...args));
};

export { wrapInTransaction };
//# sourceMappingURL=common.mjs.map
