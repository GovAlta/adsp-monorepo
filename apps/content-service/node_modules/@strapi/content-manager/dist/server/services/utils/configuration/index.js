'use strict';

require('../../../controllers/validation/index.js');
var settings = require('./settings.js');
var metadatas = require('./metadatas.js');
var layouts = require('./layouts.js');
var modelConfiguration = require('../../../controllers/validation/model-configuration.js');

async function validateCustomConfig(schema) {
    try {
        await modelConfiguration(schema, {
            allowUndefined: true
        }).validate(schema.config);
    } catch (error) {
        throw new Error(`Invalid Model configuration for model ${schema.uid}. Verify your {{ modelName }}.config.js(on) file:\n  - ${error.message}\n`);
    }
}
async function createDefaultConfiguration(schema) {
    await validateCustomConfig(schema);
    return {
        settings: await settings.createDefaultSettings(schema),
        metadatas: await metadatas.createDefaultMetadatas(schema),
        layouts: await layouts.createDefaultLayouts(schema)
    };
}
async function syncConfiguration(conf, schema) {
    await validateCustomConfig(schema);
    return {
        settings: await settings.syncSettings(conf, schema),
        layouts: await layouts.syncLayouts(conf, schema),
        metadatas: await metadatas.syncMetadatas(conf, schema)
    };
}

exports.createDefaultConfiguration = createDefaultConfiguration;
exports.syncConfiguration = syncConfiguration;
//# sourceMappingURL=index.js.map
