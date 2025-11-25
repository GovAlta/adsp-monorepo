'use strict';

var database = require('./database.js');

class InvalidDateError extends database {
    constructor(message = 'Invalid date format, expected YYYY-MM-DD'){
        super(message);
        this.name = 'InvalidDateFormat';
    }
}

module.exports = InvalidDateError;
//# sourceMappingURL=invalid-date.js.map
