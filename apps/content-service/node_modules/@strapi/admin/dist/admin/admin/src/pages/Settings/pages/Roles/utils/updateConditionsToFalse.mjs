import has from 'lodash/has';
import omit from 'lodash/omit';
import { isObject } from '../../../../../utils/objects.mjs';
import { createArrayOfValues } from './createArrayOfValues.mjs';

/**
 * Changes all the conditions leaf when the properties are all falsy
 */ const updateConditionsToFalse = (obj)=>{
    return Object.keys(obj).reduce((acc, current)=>{
        // @ts-expect-error – TODO: type better
        const currentValue = obj[current];
        if (isObject(currentValue) && !has(currentValue, 'conditions')) {
            return {
                ...acc,
                [current]: updateConditionsToFalse(currentValue)
            };
        }
        if (isObject(currentValue) && has(currentValue, 'conditions')) {
            const isActionEnabled = createArrayOfValues(omit(currentValue, 'conditions')).some((val)=>val);
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

export { updateConditionsToFalse };
//# sourceMappingURL=updateConditionsToFalse.mjs.map
