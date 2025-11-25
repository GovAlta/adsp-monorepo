import DatabaseError from './database.mjs';

class InvalidDateError extends DatabaseError {
    constructor(message = 'Invalid date format, expected YYYY-MM-DD'){
        super(message);
        this.name = 'InvalidDateFormat';
    }
}

export { InvalidDateError as default };
//# sourceMappingURL=invalid-date.mjs.map
