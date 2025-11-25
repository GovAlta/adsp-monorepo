import { Readable } from 'stream';
import { chain } from 'stream-chain';
import { set } from 'lodash/fp';

/**
 * Create a readable stream that export the Strapi app configuration
 */ const createConfigurationStream = (strapi)=>{
    return Readable.from(async function* configurationGenerator() {
        // Core Store
        const coreStoreStream = chain([
            strapi.db.queryBuilder('strapi::core-store').stream(),
            (data)=>set('value', JSON.parse(data.value), data),
            wrapConfigurationItem('core-store')
        ]);
        // Webhook
        const webhooksStream = chain([
            strapi.db.queryBuilder('strapi::webhook').stream(),
            wrapConfigurationItem('webhook')
        ]);
        const streams = [
            coreStoreStream,
            webhooksStream
        ];
        for (const stream of streams){
            for await (const item of stream){
                yield item;
            }
        }
    }());
};
const wrapConfigurationItem = (type)=>(value)=>({
            type,
            value
        });

export { createConfigurationStream };
//# sourceMappingURL=configuration.mjs.map
