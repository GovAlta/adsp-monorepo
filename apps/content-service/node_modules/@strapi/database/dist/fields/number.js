'use strict';

var _ = require('lodash/fp');
var field = require('./field.js');

class NumberField extends field {
    toDB(value) {
        const numberValue = _.toNumber(value);
        if (Number.isNaN(numberValue)) {
            throw new Error(`Expected a valid Number, got ${value}`);
        }
        return numberValue;
    }
    fromDB(value) {
        return _.toNumber(value);
    }
}

module.exports = NumberField;
//# sourceMappingURL=number.js.map
