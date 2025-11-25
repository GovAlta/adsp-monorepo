'use strict';

var _ = require('lodash/fp');
var field = require('./field.js');

class StringField extends field {
    toDB(value) {
        return _.toString(value);
    }
    fromDB(value) {
        return _.toString(value);
    }
}

module.exports = StringField;
//# sourceMappingURL=string.js.map
