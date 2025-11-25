import clone from 'lodash/clone';
import toPath from 'lodash/toPath';

/**
 * Deeply get a value from an object via its path.
 */ function getIn(obj, key, def, pathStartIndex = 0) {
    const path = toPath(key);
    while(obj && pathStartIndex < path.length){
        obj = obj[path[pathStartIndex++]];
    }
    // check if path is not in the end
    if (pathStartIndex !== path.length && !obj) {
        return def;
    }
    return obj === undefined ? def : obj;
}
/** @internal is the given object an Object? */ const isObject = (obj)=>obj !== null && typeof obj === 'object' && !Array.isArray(obj);
/** @internal is the given object an integer? */ const isInteger = (obj)=>String(Math.floor(Number(obj))) === obj;
/**
 * Deeply set a value from in object via its path. If the value at `path`
 * has changed, return a shallow copy of obj with `value` set at `path`.
 * If `value` has not changed, return the original `obj`.
 *
 * Existing objects / arrays along `path` are also shallow copied. Sibling
 * objects along path retain the same internal js reference. Since new
 * objects / arrays are only created along `path`, we can test if anything
 * changed in a nested structure by comparing the object's reference in
 * the old and new object, similar to how russian doll cache invalidation
 * works.
 *
 * In earlier versions of this function, which used cloneDeep, there were
 * issues whereby settings a nested value would mutate the parent
 * instead of creating a new object. `clone` avoids that bug making a
 * shallow copy of the objects along the update path
 * so no object is mutated in place.
 *
 * Before changing this function, please read through the following
 * discussions.
 *
 * @see https://github.com/developit/linkstate
 * @see https://github.com/jaredpalmer/formik/pull/123
 */ function setIn(obj, path, value) {
    const res = clone(obj); // this keeps inheritance when obj is a class
    let resVal = res;
    let i = 0;
    const pathArray = toPath(path);
    for(; i < pathArray.length - 1; i++){
        const currentPath = pathArray[i];
        const currentObj = getIn(obj, pathArray.slice(0, i + 1));
        if (currentObj && (isObject(currentObj) || Array.isArray(currentObj))) {
            resVal = resVal[currentPath] = clone(currentObj);
        } else {
            const nextPath = pathArray[i + 1];
            resVal = resVal[currentPath] = isInteger(nextPath) && Number(nextPath) >= 0 ? [] : {};
        }
    }
    // Return original object if new value is the same as current
    if ((i === 0 ? obj : resVal)[pathArray[i]] === value) {
        return obj;
    }
    {
        delete resVal[pathArray[i]];
    }
    // If the path array has a single element, the loop did not run.
    // Deleting on `resVal` had no effect in this scenario, so we delete on the result instead.
    if (i === 0 && value === undefined) {
        delete res[pathArray[i]];
    }
    return res;
}

export { getIn, isInteger, isObject, setIn };
//# sourceMappingURL=objects.mjs.map
