'use strict';

var isEqual = require('lodash/isEqual');
var isObject = require('lodash/isObject');
var transform = require('lodash/transform');

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

exports.difference = difference;
//# sourceMappingURL=difference.js.map
