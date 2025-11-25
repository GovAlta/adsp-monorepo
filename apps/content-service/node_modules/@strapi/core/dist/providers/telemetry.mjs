import { defineProvider } from './provider.mjs';
import createTelemetryInstance from '../services/metrics/index.mjs';

var telemetry = defineProvider({
    init (strapi) {
        strapi.add('telemetry', ()=>createTelemetryInstance(strapi));
    },
    async register (strapi) {
        strapi.get('telemetry').register();
    },
    async bootstrap (strapi) {
        strapi.get('telemetry').bootstrap();
    },
    async destroy (strapi) {
        strapi.get('telemetry').destroy();
    }
});

export { telemetry as default };
//# sourceMappingURL=telemetry.mjs.map
