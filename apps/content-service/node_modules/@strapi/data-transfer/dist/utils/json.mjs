import { isArray, zip, isObject, uniq, isEqual } from 'lodash/fp';

const createContext = ()=>({
        path: []
    });
/**
 * Compute differences between two JSON objects and returns them
 *
 * @param a - First object
 * @param b - Second object
 * @param ctx - Context used to keep track of the current path during recursion
 */ const diff = (a, b, ctx = createContext())=>{
    const diffs = [];
    const { path } = ctx;
    const aType = typeof a;
    const bType = typeof b;
    // Define helpers
    const added = ()=>{
        diffs.push({
            kind: 'added',
            path,
            type: bType,
            value: b
        });
        return diffs;
    };
    const deleted = ()=>{
        diffs.push({
            kind: 'deleted',
            path,
            type: aType,
            value: a
        });
        return diffs;
    };
    const modified = ()=>{
        diffs.push({
            kind: 'modified',
            path,
            types: [
                aType,
                bType
            ],
            values: [
                a,
                b
            ]
        });
        return diffs;
    };
    if (isArray(a) && isArray(b)) {
        let k = 0;
        for (const [aItem, bItem] of zip(a, b)){
            const kCtx = {
                path: [
                    ...path,
                    k.toString()
                ]
            };
            const kDiffs = diff(aItem, bItem, kCtx);
            diffs.push(...kDiffs);
            k += 1;
        }
        return diffs;
    }
    if (isObject(a) && isObject(b)) {
        const keys = uniq(Object.keys(a).concat(Object.keys(b)));
        for (const key of keys){
            const aValue = a[key];
            const bValue = b[key];
            const nestedDiffs = diff(aValue, bValue, {
                path: [
                    ...path,
                    key
                ]
            });
            diffs.push(...nestedDiffs);
        }
        return diffs;
    }
    if (!isEqual(a, b)) {
        if (aType === 'undefined') {
            return added();
        }
        if (bType === 'undefined') {
            return deleted();
        }
        return modified();
    }
    return diffs;
};

export { diff };
//# sourceMappingURL=json.mjs.map
