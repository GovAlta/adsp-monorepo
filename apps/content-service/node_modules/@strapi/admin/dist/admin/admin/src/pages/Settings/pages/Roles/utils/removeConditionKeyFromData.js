'use strict';

const removeConditionKeyFromData = (obj)=>{
    if (!obj) {
        return null;
    }
    return Object.entries(obj).reduce((acc, [key, value])=>{
        if (key !== 'conditions') {
            // @ts-expect-error – TODO: fix this type error correctly.
            acc[key] = value;
        }
        return acc;
    }, {});
};

exports.removeConditionKeyFromData = removeConditionKeyFromData;
//# sourceMappingURL=removeConditionKeyFromData.js.map
