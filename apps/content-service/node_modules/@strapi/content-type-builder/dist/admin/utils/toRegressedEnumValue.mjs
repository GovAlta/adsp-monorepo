import slugify from '@sindresorhus/slugify';

const toRegressedEnumValue = (value)=>{
    if (!value) {
        return '';
    }
    return slugify(value, {
        decamelize: false,
        lowercase: false,
        separator: '_'
    });
};

export { toRegressedEnumValue };
//# sourceMappingURL=toRegressedEnumValue.mjs.map
