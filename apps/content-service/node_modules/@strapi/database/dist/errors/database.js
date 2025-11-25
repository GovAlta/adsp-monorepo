'use strict';

class DatabaseError extends Error {
    constructor(message = 'A database error occured', details = {}){
        super();
        this.name = 'DatabaseError';
        this.message = message;
        this.details = details;
    }
}

module.exports = DatabaseError;
//# sourceMappingURL=database.js.map
