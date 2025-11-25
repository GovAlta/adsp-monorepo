'use strict';

var provider = require('./provider.js');
var index = require('../services/metrics/index.js');

var telemetry = provider.defineProvider({
    init (strapi) {
        strapi.add('telemetry', ()=>index(strapi));
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

module.exports = telemetry;
//# sourceMappingURL=telemetry.js.map
