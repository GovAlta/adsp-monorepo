'use strict';

var database = require('./database.js');

class InvalidRelationError extends database {
    constructor(message = 'Invalid relation format'){
        super(message);
        this.name = 'InvalidRelationFormat';
    }
}

module.exports = InvalidRelationError;
//# sourceMappingURL=invalid-relation.js.map
