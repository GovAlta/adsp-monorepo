'use strict';

var utils = require('@strapi/utils');
var utils$1 = require('./utils.js');

const signFileUrlsOnDocumentService = async ()=>{
    const { provider } = strapi.plugins.upload;
    const isPrivate = await provider.isPrivate();
    // We only need to sign the file urls if the provider is private
    if (!isPrivate) {
        return;
    }
    strapi.documents.use(async (ctx, next)=>{
        const uid = ctx.uid;
        const result = await next();
        if (ctx.action === 'findMany') {
            // Shape: [ entry ]
            return utils.async.map(result, (entry)=>utils$1.signEntityMedia(entry, uid));
        }
        if (ctx.action === 'findFirst' || ctx.action === 'findOne' || ctx.action === 'create' || ctx.action === 'update') {
            // Shape: entry
            return utils$1.signEntityMedia(result, uid);
        }
        if (ctx.action === 'delete' || ctx.action === 'clone' || ctx.action === 'publish' || ctx.action === 'unpublish' || ctx.action === 'discardDraft') {
            // Shape: { entries: [ entry ] }
            // ...
            return {
                ...result,
                entries: await utils.async.map(result.entries, (entry)=>utils$1.signEntityMedia(entry, uid))
            };
        }
        return result;
    });
};
var extensions = {
    signFileUrlsOnDocumentService
};

module.exports = extensions;
//# sourceMappingURL=index.js.map
