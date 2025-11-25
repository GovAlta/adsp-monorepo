class DatabaseError extends Error {
    constructor(message = 'A database error occured', details = {}){
        super();
        this.name = 'DatabaseError';
        this.message = message;
        this.details = details;
    }
}

export { DatabaseError as default };
//# sourceMappingURL=database.mjs.map
