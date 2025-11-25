'use strict';

var undici = require('undici');

// Create a wrapper for Node's Fetch API that applies a global proxy
const createStrapiFetch = (strapi, options)=>{
    const { logs = true } = options ?? {};
    function strapiFetch(url, options) {
        const fetchOptions = {
            ...strapiFetch.dispatcher ? {
                dispatcher: strapiFetch.dispatcher
            } : {},
            ...options
        };
        if (logs) {
            strapi.log.debug(`Making request for ${url}`);
        }
        return fetch(url, fetchOptions);
    }
    const proxy = strapi.config.get('server.proxy.fetch') || strapi.config.get('server.proxy.global');
    if (proxy) {
        if (logs) {
            strapi.log.info(`Using proxy for Fetch requests: ${proxy}`);
        }
        strapiFetch.dispatcher = new undici.ProxyAgent(proxy);
    }
    return strapiFetch;
};

exports.createStrapiFetch = createStrapiFetch;
//# sourceMappingURL=fetch.js.map
