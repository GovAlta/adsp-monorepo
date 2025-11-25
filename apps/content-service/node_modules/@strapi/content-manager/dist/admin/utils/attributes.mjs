const checkIfAttributeIsDisplayable = (attribute)=>{
    const { type } = attribute;
    if (type === 'relation') {
        return !attribute.relation.toLowerCase().includes('morph');
    }
    return ![
        'json',
        'dynamiczone',
        'richtext',
        'password',
        'blocks'
    ].includes(type) && !!type;
};
/**
 * @internal
 * @description given an attribute, content-type schemas & component schemas, find the mainField name & type.
 * If the attribute does not need a `mainField` then we return undefined. If we do not find the type
 * of the field, we assume it's a string #sensible-defaults
 */ const getMainField = (attribute, mainFieldName, { schemas, components })=>{
    if (!mainFieldName) {
        return undefined;
    }
    const mainFieldType = attribute.type === 'component' ? components[attribute.component].attributes[mainFieldName].type : schemas.find((schema)=>schema.uid === attribute.targetModel)?.attributes[mainFieldName].type;
    return {
        name: mainFieldName,
        type: mainFieldType ?? 'string'
    };
};

export { checkIfAttributeIsDisplayable, getMainField };
//# sourceMappingURL=attributes.mjs.map
