'use strict';

var database = require('./database.js');

class NotNullError extends database {
    constructor({ column = '' } = {}){
        super(`Not null constraint violation${column ? ` on column ${column}` : ''}.`);
        this.name = 'NotNullError';
        this.details = {
            column
        };
        this.stack = '';
    }
}

module.exports = NotNullError;
//# sourceMappingURL=not-null.js.map
