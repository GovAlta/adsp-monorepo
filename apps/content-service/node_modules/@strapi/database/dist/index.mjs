import path from 'node:path';
import { getDialect } from './dialects/index.mjs';
import { createSchemaProvider } from './schema/index.mjs';
import { createMetadata } from './metadata/index.mjs';
import { createEntityManager } from './entity-manager/index.mjs';
import { createMigrationsProvider } from './migrations/index.mjs';
import { createLifecyclesProvider } from './lifecycles/index.mjs';
import { createConnection } from './connection.mjs';
import * as index from './errors/index.mjs';
export { index as errors };
import { transactionCtx } from './transaction-context.mjs';
import { validateDatabase } from './validations/index.mjs';
import { createRepairManager } from './repairs/index.mjs';
export { isKnexQuery } from './utils/knex.mjs';

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
        await validateDatabase(this);
        return this;
    }
    query(uid) {
        if (!this.metadata.has(uid)) {
            throw new Error(`Model ${uid} not found`);
        }
        return this.entityManager.getRepository(uid);
    }
    inTransaction() {
        return !!transactionCtx.get();
    }
    async transaction(cb) {
        const notNestedTransaction = !transactionCtx.get();
        const trx = notNestedTransaction ? await this.connection.transaction() : transactionCtx.get();
        async function commit() {
            if (notNestedTransaction) {
                await transactionCtx.commit(trx);
            }
        }
        async function rollback() {
            if (notNestedTransaction) {
                await transactionCtx.rollback(trx);
            }
        }
        if (!cb) {
            return {
                commit,
                rollback,
                get: ()=>trx
            };
        }
        return transactionCtx.run(trx, async ()=>{
            try {
                const callbackParams = {
                    trx,
                    commit,
                    rollback,
                    onCommit: transactionCtx.onCommit,
                    onRollback: transactionCtx.onRollback
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
        this.dialect = getDialect(this);
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
        this.metadata = createMetadata([]);
        this.connection = createConnection(knexConfig, {
            pool: {
                afterCreate: afterCreate(this)
            }
        });
        this.schema = createSchemaProvider(this);
        this.migrations = createMigrationsProvider(this);
        this.lifecycles = createLifecyclesProvider(this);
        this.entityManager = createEntityManager(this);
        this.repair = createRepairManager(this);
    }
}

export { Database };
//# sourceMappingURL=index.mjs.map
