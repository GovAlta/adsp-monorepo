import DatabaseError from './database.mjs';

class InvalidDateTimeError extends DatabaseError {
    constructor(message = 'Invalid relation format'){
        super(message);
        this.name = 'InvalidDatetimeFormat';
    }
}

export { InvalidDateTimeError as default };
//# sourceMappingURL=invalid-datetime.mjs.map
