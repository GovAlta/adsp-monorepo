import '../../../controllers/validation/index.mjs';
import { createDefaultSettings, syncSettings } from './settings.mjs';
import { createDefaultMetadatas, syncMetadatas } from './metadatas.mjs';
import { createDefaultLayouts, syncLayouts } from './layouts.mjs';
import createModelConfigurationSchema from '../../../controllers/validation/model-configuration.mjs';

async function validateCustomConfig(schema) {
    try {
        await createModelConfigurationSchema(schema, {
            allowUndefined: true
        }).validate(schema.config);
    } catch (error) {
        throw new Error(`Invalid Model configuration for model ${schema.uid}. Verify your {{ modelName }}.config.js(on) file:\n  - ${error.message}\n`);
    }
}
async function createDefaultConfiguration(schema) {
    await validateCustomConfig(schema);
    return {
        settings: await createDefaultSettings(schema),
        metadatas: await createDefaultMetadatas(schema),
        layouts: await createDefaultLayouts(schema)
    };
}
async function syncConfiguration(conf, schema) {
    await validateCustomConfig(schema);
    return {
        settings: await syncSettings(conf, schema),
        layouts: await syncLayouts(conf, schema),
        metadatas: await syncMetadatas(conf, schema)
    };
}

export { createDefaultConfiguration, syncConfiguration };
//# sourceMappingURL=index.mjs.map
