'use strict';

var stream = require('stream');
var streamChain = require('stream-chain');
var fp = require('lodash/fp');

/**
 * Create a readable stream that export the Strapi app configuration
 */ const createConfigurationStream = (strapi)=>{
    return stream.Readable.from(async function* configurationGenerator() {
        // Core Store
        const coreStoreStream = streamChain.chain([
            strapi.db.queryBuilder('strapi::core-store').stream(),
            (data)=>fp.set('value', JSON.parse(data.value), data),
            wrapConfigurationItem('core-store')
        ]);
        // Webhook
        const webhooksStream = streamChain.chain([
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

exports.createConfigurationStream = createConfigurationStream;
//# sourceMappingURL=configuration.js.map
