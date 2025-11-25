'use strict';

var users = require('./users.js');
var internal = require('./internal.js');

const createMigrationsProvider = (db)=>{
    const userProvider = users.createUserMigrationProvider(db);
    const internalProvider = internal.createInternalMigrationProvider(db);
    const providers = [
        userProvider,
        internalProvider
    ];
    return {
        providers: {
            internal: internalProvider
        },
        async shouldRun () {
            const shouldRunResponses = await Promise.all(providers.map((provider)=>provider.shouldRun()));
            return shouldRunResponses.some((shouldRun)=>shouldRun);
        },
        async up () {
            for (const provider of providers){
                if (await provider.shouldRun()) {
                    await provider.up();
                }
            }
        },
        async down () {
            for (const provider of providers){
                if (await provider.shouldRun()) {
                    await provider.down();
                }
            }
        }
    };
};

exports.createMigrationsProvider = createMigrationsProvider;
//# sourceMappingURL=index.js.map
