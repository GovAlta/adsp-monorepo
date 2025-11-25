'use strict';

var path = require('node:path');
var index$2 = require('./dialects/index.js');
var index$4 = require('./schema/index.js');
var index$3 = require('./metadata/index.js');
var index$7 = require('./entity-manager/index.js');
var index$5 = require('./migrations/index.js');
var index$6 = require('./lifecycles/index.js');
var connection = require('./connection.js');
var index = require('./errors/index.js');
var transactionContext = require('./transaction-context.js');
var index$1 = require('./validations/index.js');
var index$8 = require('./repairs/index.js');
var knex = require('./utils/knex.js');

const afterCreate = (db)=>(nativeConnection, done)=>{
        // run initialize for it since commands such as postgres SET and sqlite PRAGMA are per-connection
        db.dialect.initialize(nativeConnection).then(()=>{
            return done(null, nativeConnection);
        });
    };
class Database {
    async init({ models }) {
        if (typeof this.config.connection.connection === 'function') {
            /*
       * User code needs to be able to access `connection.connection` directly as if
       * it were always an object. For a connection function, that doesn't happen
       * until the pool is created, so we need to do that here
       *
       * TODO: In the next major version, we need to replace all internal code that
       * directly references `connection.connection` prior to init, and make a breaking
       * change that it cannot be relied on to exist before init so that we can call
       * this feature stable.
       */ this.logger.debug('Forcing Knex to make real connection to db');
            // sqlite does not support connection pooling so acquireConnection doesn't work
            if (this.config.connection.client === 'sqlite') {
                await this.connection.raw('SELECT 1');
            } else {
                await this.connection.client.acquireConnection();
            }
        }
        this.metadata.loadModels(models);
        await index$1.validateDatabase(this);
        return this;
    }
    query(uid) {
        if (!this.metadata.has(uid)) {
            throw new Error(`Model ${uid} not found`);
        }
        return this.entityManager.getRepository(uid);
    }
    inTransaction() {
        return !!transactionContext.transactionCtx.get();
    }
    async transaction(cb) {
        const notNestedTransaction = !transactionContext.transactionCtx.get();
        const trx = notNestedTransaction ? await this.connection.transaction() : transactionContext.transactionCtx.get();
        async function commit() {
            if (notNestedTransaction) {
                await transactionContext.transactionCtx.commit(trx);
            }
        }
        async function rollback() {
            if (notNestedTransaction) {
                await transactionContext.transactionCtx.rollback(trx);
            }
        }
        if (!cb) {
            return {
                commit,
                rollback,
                get: ()=>trx
            };
        }
        return transactionContext.transactionCtx.run(trx, async ()=>{
            try {
                const callbackParams = {
                    trx,
                    commit,
                    rollback,
                    onCommit: transactionContext.transactionCtx.onCommit,
                    onRollback: transactionContext.transactionCtx.onRollback
                };
                const res = await cb(callbackParams);
                await commit();
                return res;
            } catch (error) {
                await rollback();
                throw error;
            }
        });
    }
    getSchemaName() {
        return this.connection.client.connectionSettings.schema;
    }
    getConnection(tableName) {
        const schema = this.getSchemaName();
        const connection = tableName ? this.connection(tableName) : this.connection;
        return schema ? connection.withSchema(schema) : connection;
    }
    // Returns basic info about the database connection
    getInfo() {
        const connectionSettings = this.connection?.client?.connectionSettings || {};
        const client = this.dialect?.client || '';
        let displayName = '';
        let schema;
        // For SQLite, get the relative filename
        if (client === 'sqlite') {
            const absolutePath = connectionSettings?.filename;
            if (absolutePath) {
                displayName = path.relative(process.cwd(), absolutePath);
            }
        } else {
            displayName = connectionSettings?.database;
            schema = connectionSettings?.schema;
        }
        return {
            displayName,
            schema,
            client
        };
    }
    getSchemaConnection(trx = this.connection) {
        const schema = this.getSchemaName();
        return schema ? trx.schema.withSchema(schema) : trx.schema;
    }
    queryBuilder(uid) {
        return this.entityManager.createQueryBuilder(uid);
    }
    async destroy() {
        await this.lifecycles.clear();
        await this.connection.destroy();
    }
    constructor(config){
        this.config = {
            ...config,
            settings: {
                forceMigration: true,
                runMigrations: true,
                ...config.settings ?? {}
            }
        };
        this.logger = config.logger ?? console;
        this.dialect = index$2.getDialect(this);
        let knexConfig = this.config.connection;
        // for object connections, we can configure the dialect synchronously
        if (typeof this.config.connection.connection !== 'function') {
            this.dialect.configure();
        } else {
            this.logger.warn('Knex connection functions are currently experimental. Attempting to access the connection object before database initialization will result in errors.');
            knexConfig = {
                ...this.config.connection,
                connection: async ()=>{
                    // @ts-expect-error confirmed it was a function above
                    const conn = await this.config.connection.connection();
                    this.dialect.configure(conn);
                    return conn;
                }
            };
        }
        this.metadata = index$3.createMetadata([]);
        this.connection = connection.createConnection(knexConfig, {
            pool: {
                afterCreate: afterCreate(this)
            }
        });
        this.schema = index$4.createSchemaProvider(this);
        this.migrations = index$5.createMigrationsProvider(this);
        this.lifecycles = index$6.createLifecyclesProvider(this);
        this.entityManager = index$7.createEntityManager(this);
        this.repair = index$8.createRepairManager(this);
    }
}

exports.errors = index;
exports.isKnexQuery = knex.isKnexQuery;
exports.Database = Database;
//# sourceMappingURL=index.js.map
