import { Writable } from 'stream';
import { omit } from 'lodash/fp';
import chalk from 'chalk';
import { ProviderTransferError } from '../../../../../errors/providers.mjs';

const omitInvalidCreationAttributes = omit([
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
    return new Writable({
        objectMode: true,
        async write (config, _encoding, callback) {
            await transaction?.attach(async ()=>{
                try {
                    await restoreConfigs(strapi, config);
                } catch (error) {
                    return callback(new ProviderTransferError(`Failed to import ${chalk.yellowBright(config.type)} (${chalk.greenBright(config.value.id)}`));
                }
                callback();
            });
        }
    });
};

export { createConfigurationWriteStream, restoreConfigs };
//# sourceMappingURL=configuration.mjs.map
