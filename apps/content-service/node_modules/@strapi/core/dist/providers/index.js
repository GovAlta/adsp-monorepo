'use strict';

var admin = require('./admin.js');
var coreStore = require('./coreStore.js');
var cron = require('./cron.js');
var registries = require('./registries.js');
var sessionManager = require('./session-manager.js');
var telemetry = require('./telemetry.js');
var webhooks = require('./webhooks.js');

const providers = [
    registries,
    admin,
    coreStore,
    sessionManager,
    webhooks,
    telemetry,
    cron
];

exports.providers = providers;
//# sourceMappingURL=index.js.map
