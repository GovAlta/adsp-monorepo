'use strict';

var _ = require('lodash/fp');
var field = require('./field.js');

function isStringOrNumber(value) {
    return typeof value === 'string' || typeof value === 'number';
}
class BooleanField extends field {
    toDB(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (isStringOrNumber(value) && [
            'true',
            't',
            '1',
            1
        ].includes(value)) {
            return true;
        }
        if (isStringOrNumber(value) && [
            'false',
            'f',
            '0',
            0
        ].includes(value)) {
            return false;
        }
        return Boolean(value);
    }
    fromDB(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        const strVal = _.toString(value);
        if (strVal === '1') {
            return true;
        }
        if (strVal === '0') {
            return false;
        }
        return null;
    }
}

module.exports = BooleanField;
//# sourceMappingURL=boolean.js.map
