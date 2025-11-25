'use strict';

var umzug = require('umzug');
var common = require('./common.js');
var index = require('./internal-migrations/index.js');
var storage = require('./storage.js');
var logger = require('./logger.js');

const createInternalMigrationProvider = (db)=>{
    const context = {
        db
    };
    const migrations = [
        ...index.internalMigrations
    ];
    const umzugProvider = new umzug.Umzug({
        storage: storage.createStorage({
            db,
            tableName: 'strapi_migrations_internal'
        }),
        logger: {
            info (message) {
                // NOTE: only log internal migration in debug mode
                db.logger.debug(logger.transformLogMessage('info', message));
            },
            warn (message) {
                db.logger.warn(logger.transformLogMessage('warn', message));
            },
            error (message) {
                db.logger.error(logger.transformLogMessage('error', message));
            },
            debug (message) {
                db.logger.debug(logger.transformLogMessage('debug', message));
            }
        },
        context,
        migrations: ()=>migrations.map((migration)=>{
                return {
                    name: migration.name,
                    up: common.wrapTransaction(context.db)(migration.up),
                    down: common.wrapTransaction(context.db)(migration.down)
                };
            })
    });
    return {
        async register (migration) {
            migrations.push(migration);
        },
        async shouldRun () {
            const pendingMigrations = await umzugProvider.pending();
            return pendingMigrations.length > 0;
        },
        async up () {
            await umzugProvider.up();
        },
        async down () {
            await umzugProvider.down();
        }
    };
};

exports.createInternalMigrationProvider = createInternalMigrationProvider;
//# sourceMappingURL=internal.js.map
