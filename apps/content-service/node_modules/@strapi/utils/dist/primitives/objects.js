'use strict';

var _ = require('lodash');

const keysDeep = (obj, path = [])=>!_.isObject(obj) ? [
        path.join('.')
    ] : _.reduce(obj, (acc, next, key)=>_.concat(acc, keysDeep(next, [
            ...path,
            key
        ])), []);

exports.keysDeep = keysDeep;
//# sourceMappingURL=objects.js.map
