import DatabaseError from './database.mjs';

class InvalidRelationError extends DatabaseError {
    constructor(message = 'Invalid relation format'){
        super(message);
        this.name = 'InvalidRelationFormat';
    }
}

export { InvalidRelationError as default };
//# sourceMappingURL=invalid-relation.mjs.map
