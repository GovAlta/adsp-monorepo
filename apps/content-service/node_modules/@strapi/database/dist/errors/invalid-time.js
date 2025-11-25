'use strict';

var database = require('./database.js');

class InvalidTimeError extends database {
    constructor(message = 'Invalid time format, expected HH:mm:ss.SSS'){
        super(message);
        this.name = 'InvalidTimeFormat';
    }
}

module.exports = InvalidTimeError;
//# sourceMappingURL=invalid-time.js.map
