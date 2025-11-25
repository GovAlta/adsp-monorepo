'use strict';

var parsers = require('./shared/parsers.js');
var field = require('./field.js');

class TimeField extends field {
    toDB(value) {
        return parsers.parseTime(value);
    }
    fromDB(value) {
        // make sure that's a string with valid format ?
        return value;
    }
}

module.exports = TimeField;
//# sourceMappingURL=time.js.map
