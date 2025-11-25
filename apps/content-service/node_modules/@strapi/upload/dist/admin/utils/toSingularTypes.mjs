const toSingularTypes = (types)=>{
    if (!types) {
        return [];
    }
    return types.map((type)=>type.substring(0, type.length - 1));
};

export { toSingularTypes };
//# sourceMappingURL=toSingularTypes.mjs.map
