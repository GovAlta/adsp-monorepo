import DatabaseError from './database.mjs';

class NotNullError extends DatabaseError {
    constructor({ column = '' } = {}){
        super(`Not null constraint violation${column ? ` on column ${column}` : ''}.`);
        this.name = 'NotNullError';
        this.details = {
            column
        };
        this.stack = '';
    }
}

export { NotNullError as default };
//# sourceMappingURL=not-null.mjs.map
