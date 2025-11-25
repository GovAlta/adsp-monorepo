import { createUserMigrationProvider } from './users.mjs';
import { createInternalMigrationProvider } from './internal.mjs';

const createMigrationsProvider = (db)=>{
    const userProvider = createUserMigrationProvider(db);
    const internalProvider = createInternalMigrationProvider(db);
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

export { createMigrationsProvider };
//# sourceMappingURL=index.mjs.map
