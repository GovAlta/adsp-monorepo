'use strict';

const customFieldDefaultOptionsReducer = (acc, option)=>{
    if (option.items) {
        return option.items.reduce(customFieldDefaultOptionsReducer, acc);
    }
    if ('defaultValue' in option) {
        const { name, defaultValue } = option;
        acc.push({
            name,
            defaultValue
        });
    }
    return acc;
};

exports.customFieldDefaultOptionsReducer = customFieldDefaultOptionsReducer;
//# sourceMappingURL=customFieldDefaultOptionsReducer.js.map
