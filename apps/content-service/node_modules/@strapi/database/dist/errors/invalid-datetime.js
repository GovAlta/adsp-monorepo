'use strict';

var database = require('./database.js');

class InvalidDateTimeError extends database {
    constructor(message = 'Invalid relation format'){
        super(message);
        this.name = 'InvalidDatetimeFormat';
    }
}

module.exports = InvalidDateTimeError;
//# sourceMappingURL=invalid-datetime.js.map
