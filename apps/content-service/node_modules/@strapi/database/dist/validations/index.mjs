import { validateRelations } from './relations/index.mjs';

/**
 * Validate if the database is in a valid state before starting the server.
 */ async function validateDatabase(db) {
    await validateRelations(db);
}

export { validateDatabase };
//# sourceMappingURL=index.mjs.map
