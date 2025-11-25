'use strict';

var stream = require('stream');
var fp = require('lodash/fp');
var chalk = require('chalk');
var providers = require('../../../../../errors/providers.js');

const omitInvalidCreationAttributes = fp.omit([
    'id'
]);
const restoreCoreStore = async (strapi, values)=>{
    const data = omitInvalidCreationAttributes(values);
    return strapi.db.query('strapi::core-store').create({
        data: {
            ...data,
            value: JSON.stringify(data.value)
        }
    });
};
const restoreWebhooks = async (strapi, values)=>{
    const data = omitInvalidCreationAttributes(values);
    return strapi.db.query('strapi::webhook').create({
        data
    });
};
const restoreConfigs = async (strapi, config)=>{
    if (config.type === 'core-store') {
        return restoreCoreStore(strapi, config.value);
    }
    if (config.type === 'webhook') {
        return restoreWebhooks(strapi, config.value);
    }
};
const createConfigurationWriteStream = async (strapi, transaction)=>{
    return new stream.Writable({
        objectMode: true,
        async write (config, _encoding, callback) {
            await transaction?.attach(async ()=>{
                try {
                    await restoreConfigs(strapi, config);
                } catch (error) {
                    return callback(new providers.ProviderTransferError(`Failed to import ${chalk.yellowBright(config.type)} (${chalk.greenBright(config.value.id)}`));
                }
                callback();
            });
        }
    });
};

exports.createConfigurationWriteStream = createConfigurationWriteStream;
exports.restoreConfigs = restoreConfigs;
//# sourceMappingURL=configuration.js.map
