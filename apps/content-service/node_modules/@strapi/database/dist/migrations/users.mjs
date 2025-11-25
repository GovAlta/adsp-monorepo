import fse from 'fs-extra';
import { Umzug } from 'umzug';
import { createStorage } from './storage.mjs';
import { wrapTransaction } from './common.mjs';
import { transformLogMessage } from './logger.mjs';

// TODO: check multiple commands in one sql statement
const migrationResolver = ({ name, path, context })=>{
    const { db } = context;
    if (!path) {
        throw new Error(`Migration ${name} has no path`);
    }
    // if sql file run with knex raw
    if (path.match(/\.sql$/)) {
        const sql = fse.readFileSync(path, 'utf8');
        return {
            name,
            up: wrapTransaction(db)((knex)=>knex.raw(sql)),
            async down () {
                throw new Error('Down migration is not supported for sql files');
            }
        };
    }
    // NOTE: we can add some ts register if we want to handle ts migration files at some point
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration = require(path);
    return {
        name,
        up: wrapTransaction(db)(migration.up),
        down: wrapTransaction(db)(migration.down)
    };
};
const createUserMigrationProvider = (db)=>{
    const dir = db.config.settings.migrations.dir;
    fse.ensureDirSync(dir);
    const context = {
        db
    };
    const umzugProvider = new Umzug({
        storage: createStorage({
            db,
            tableName: 'strapi_migrations'
        }),
        logger: {
            info (message) {
                // NOTE: only log internal migration in debug mode
                db.logger.info(transformLogMessage('info', message));
            },
            warn (message) {
                db.logger.warn(transformLogMessage('warn', message));
            },
            error (message) {
                db.logger.error(transformLogMessage('error', message));
            },
            debug (message) {
                db.logger.debug(transformLogMessage('debug', message));
            }
        },
        context,
        migrations: {
            glob: [
                '*.{js,sql}',
                {
                    cwd: dir
                }
            ],
            resolve: migrationResolver
        }
    });
    return {
        async shouldRun () {
            const pendingMigrations = await umzugProvider.pending();
            return pendingMigrations.length > 0 && db.config?.settings?.runMigrations === true;
        },
        async up () {
            await umzugProvider.up();
        },
        async down () {
            await umzugProvider.down();
        }
    };
};

export { createUserMigrationProvider };
//# sourceMappingURL=users.mjs.map
