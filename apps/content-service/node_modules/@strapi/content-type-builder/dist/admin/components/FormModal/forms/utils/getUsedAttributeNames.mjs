const getUsedAttributeNames = (attributes, schemaData)=>{
    return attributes.filter(({ name })=>{
        return name !== schemaData.initialData.name;
    }).map(({ name })=>name);
};

export { getUsedAttributeNames };
//# sourceMappingURL=getUsedAttributeNames.mjs.map
