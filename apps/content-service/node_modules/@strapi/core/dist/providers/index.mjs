import admin from './admin.mjs';
import coreStore from './coreStore.mjs';
import cron from './cron.mjs';
import registries from './registries.mjs';
import sessionManager from './session-manager.mjs';
import telemetry from './telemetry.mjs';
import webhooks from './webhooks.mjs';

const providers = [
    registries,
    admin,
    coreStore,
    sessionManager,
    webhooks,
    telemetry,
    cron
];

export { providers };
//# sourceMappingURL=index.mjs.map
