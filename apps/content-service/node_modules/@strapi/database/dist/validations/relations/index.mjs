import { validateBidirectionalRelations } from './bidirectional.mjs';

/**
 * Validates if relations data and tables are in a valid state before
 * starting the server.
 */ const validateRelations = async (db)=>{
    await validateBidirectionalRelations(db);
};

export { validateRelations };
//# sourceMappingURL=index.mjs.map
