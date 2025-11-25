import knex from 'knex';

const clientMap = {
    sqlite: 'better-sqlite3',
    mysql: 'mysql2',
    postgres: 'pg'
};
function isClientValid(config) {
    return Object.keys(clientMap).includes(config.client);
}
const createConnection = (userConfig, strapiConfig)=>{
    if (!isClientValid(userConfig)) {
        throw new Error(`Unsupported database client ${userConfig.client}`);
    }
    const knexConfig = {
        ...userConfig,
        client: clientMap[userConfig.client]
    };
    // initialization code to run upon opening a new connection
    if (strapiConfig?.pool?.afterCreate) {
        knexConfig.pool = knexConfig.pool || {};
        // if the user has set their own afterCreate in config, we will replace it and call it
        const userAfterCreate = knexConfig.pool?.afterCreate;
        const strapiAfterCreate = strapiConfig.pool.afterCreate;
        knexConfig.pool.afterCreate = (conn, done)=>{
            strapiAfterCreate(conn, (err, nativeConn)=>{
                if (err) {
                    return done(err, nativeConn);
                }
                if (userAfterCreate) {
                    return userAfterCreate(nativeConn, done);
                }
                return done(null, nativeConn);
            });
        };
    }
    return knex(knexConfig);
};

export { createConnection };
//# sourceMappingURL=connection.mjs.map
