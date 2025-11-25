import ___default from 'lodash';

const keysDeep = (obj, path = [])=>!___default.isObject(obj) ? [
        path.join('.')
    ] : ___default.reduce(obj, (acc, next, key)=>___default.concat(acc, keysDeep(next, [
            ...path,
            key
        ])), []);

export { keysDeep };
//# sourceMappingURL=objects.mjs.map
