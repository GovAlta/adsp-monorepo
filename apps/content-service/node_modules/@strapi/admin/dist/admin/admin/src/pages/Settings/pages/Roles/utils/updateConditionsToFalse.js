'use strict';

var has = require('lodash/has');
var omit = require('lodash/omit');
var objects = require('../../../../../utils/objects.js');
var createArrayOfValues = require('./createArrayOfValues.js');

/**
 * Changes all the conditions leaf when the properties are all falsy
 */ const updateConditionsToFalse = (obj)=>{
    return Object.keys(obj).reduce((acc, current)=>{
        // @ts-expect-error – TODO: type better
        const currentValue = obj[current];
        if (objects.isObject(currentValue) && !has(currentValue, 'conditions')) {
            return {
                ...acc,
                [current]: updateConditionsToFalse(currentValue)
            };
        }
        if (objects.isObject(currentValue) && has(currentValue, 'conditions')) {
            const isActionEnabled = createArrayOfValues.createArrayOfValues(omit(currentValue, 'conditions')).some((val)=>val);
            if (!isActionEnabled) {
                // @ts-expect-error – TODO: type better
                const updatedConditions = Object.keys(currentValue.conditions).reduce((acc1, current)=>{
                    // @ts-expect-error – TODO: type better
                    acc1[current] = false;
                    return acc1;
                }, {});
                return {
                    ...acc,
                    [current]: {
                        ...currentValue,
                        conditions: updatedConditions
                    }
                };
            }
        }
        // @ts-expect-error – TODO: type better
        acc[current] = currentValue;
        return acc;
    }, {});
};

exports.updateConditionsToFalse = updateConditionsToFalse;
//# sourceMappingURL=updateConditionsToFalse.js.map
