'use strict';

var index$2 = require('./postgresql/index.js');
var index$1 = require('./mysql/index.js');
var index = require('./sqlite/index.js');

/**
 * Require our dialect-specific code
 */ const getDialectClass = (client)=>{
    switch(client){
        case 'postgres':
            return index$2;
        case 'mysql':
            return index$1;
        case 'sqlite':
            return index;
        default:
            throw new Error(`Unknown dialect ${client}`);
    }
};
/**
 * Get the dialect of a database client
 */ const getDialectName = (client)=>{
    switch(client){
        case 'postgres':
            return 'postgres';
        case 'mysql':
            return 'mysql';
        case 'sqlite':
            return 'sqlite';
        default:
            throw new Error(`Unknown dialect ${client}`);
    }
};
const getDialect = (db)=>{
    const { client } = db.config.connection;
    const dialectName = getDialectName(client);
    const constructor = getDialectClass(dialectName);
    const dialect = new constructor(db, dialectName);
    return dialect;
};

exports.getDialect = getDialect;
//# sourceMappingURL=index.js.map
