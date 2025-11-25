import { async } from '@strapi/utils';
import { signEntityMedia } from './utils.mjs';

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
            return async.map(result, (entry)=>signEntityMedia(entry, uid));
        }
        if (ctx.action === 'findFirst' || ctx.action === 'findOne' || ctx.action === 'create' || ctx.action === 'update') {
            // Shape: entry
            return signEntityMedia(result, uid);
        }
        if (ctx.action === 'delete' || ctx.action === 'clone' || ctx.action === 'publish' || ctx.action === 'unpublish' || ctx.action === 'discardDraft') {
            // Shape: { entries: [ entry ] }
            // ...
            return {
                ...result,
                entries: await async.map(result.entries, (entry)=>signEntityMedia(entry, uid))
            };
        }
        return result;
    });
};
var extensions = {
    signFileUrlsOnDocumentService
};

export { extensions as default };
//# sourceMappingURL=index.mjs.map
