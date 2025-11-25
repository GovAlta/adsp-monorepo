'use strict';

function getOpenValues(options, defaultValue = {}) {
    const values = [];
    const { value } = defaultValue;
    const option = options.find((option)=>option.value === value);
    if (!option) {
        return values;
    }
    values.push(option.value);
    let { parent } = option;
    while(parent !== undefined){
        const option = options.find(({ value })=>value === parent);
        if (!option) {
            break;
        }
        values.push(option.value);
        parent = option.parent;
    }
    return values.reverse();
}

exports.getOpenValues = getOpenValues;
//# sourceMappingURL=getOpenValues.js.map
