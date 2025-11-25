'use strict';

var arrays = require('../../../../../utils/arrays.js');
var objects = require('../../../../../utils/objects.js');

const createArrayOfValues = (obj)=>{
    if (!objects.isObject(obj)) {
        return [];
    }
    return arrays.flattenDeep(Object.values(obj).map((value)=>{
        if (objects.isObject(value)) {
            return createArrayOfValues(value);
        }
        return value;
    }));
};

exports.createArrayOfValues = createArrayOfValues;
//# sourceMappingURL=createArrayOfValues.js.map
