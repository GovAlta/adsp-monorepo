'use strict';

var parsers = require('./shared/parsers.js');
var field = require('./field.js');

class DateField extends field {
    toDB(value) {
        return parsers.parseDate(value);
    }
    fromDB(value) {
        return value;
    }
}

module.exports = DateField;
//# sourceMappingURL=date.js.map
