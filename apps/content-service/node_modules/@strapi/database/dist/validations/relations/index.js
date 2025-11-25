'use strict';

var bidirectional = require('./bidirectional.js');

/**
 * Validates if relations data and tables are in a valid state before
 * starting the server.
 */ const validateRelations = async (db)=>{
    await bidirectional.validateBidirectionalRelations(db);
};

exports.validateRelations = validateRelations;
//# sourceMappingURL=index.js.map
