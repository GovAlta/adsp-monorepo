import DatabaseError from './database.mjs';

class InvalidTimeError extends DatabaseError {
    constructor(message = 'Invalid time format, expected HH:mm:ss.SSS'){
        super(message);
        this.name = 'InvalidTimeFormat';
    }
}

export { InvalidTimeError as default };
//# sourceMappingURL=invalid-time.mjs.map
