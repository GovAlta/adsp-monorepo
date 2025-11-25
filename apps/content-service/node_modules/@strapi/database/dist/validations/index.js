'use strict';

var index = require('./relations/index.js');

/**
 * Validate if the database is in a valid state before starting the server.
 */ async function validateDatabase(db) {
    await index.validateRelations(db);
}

exports.validateDatabase = validateDatabase;
//# sourceMappingURL=index.js.map
