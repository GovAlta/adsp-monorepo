/**
 * @internal
 * @description Mutates a value to be a union of flat values, no arrays allowed.
 */ /**
 * @internal
 *
 * @description Flattens an array recursively.
 */ const flattenDeep = (array)=>{
    if (Array.isArray(array)) {
        return array.reduce((acc, value)=>{
            if (Array.isArray(value)) {
                acc.push(...flattenDeep(value));
            } else {
                acc.push(value);
            }
            return acc;
        }, []);
    } else {
        return [];
    }
};

export { flattenDeep };
//# sourceMappingURL=arrays.mjs.map
