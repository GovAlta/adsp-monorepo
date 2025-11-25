import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import transform from 'lodash/transform';

function difference(object, base) {
    function changes(object, base) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return transform(object, (result, value, key)=>{
            if (!isEqual(value, base[key])) {
                result[key] = isObject(value) && isObject(base[key]) ? changes(value, base[key]) : value;
            }
            return result;
        });
    }
    return changes(object, base);
}

export { difference };
//# sourceMappingURL=difference.mjs.map
