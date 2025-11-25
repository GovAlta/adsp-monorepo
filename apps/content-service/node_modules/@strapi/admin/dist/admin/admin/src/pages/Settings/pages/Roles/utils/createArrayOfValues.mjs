import { flattenDeep } from '../../../../../utils/arrays.mjs';
import { isObject } from '../../../../../utils/objects.mjs';

const createArrayOfValues = (obj)=>{
    if (!isObject(obj)) {
        return [];
    }
    return flattenDeep(Object.values(obj).map((value)=>{
        if (isObject(value)) {
            return createArrayOfValues(value);
        }
        return value;
    }));
};

export { createArrayOfValues };
//# sourceMappingURL=createArrayOfValues.mjs.map
