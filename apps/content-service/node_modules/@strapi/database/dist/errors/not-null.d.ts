import DatabaseError from './database';
export default class NotNullError extends DatabaseError {
    constructor({ column }?: {
        column?: string | undefined;
    });
}
//# sourceMappingURL=not-null.d.ts.map