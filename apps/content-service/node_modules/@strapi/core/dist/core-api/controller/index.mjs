import { prop } from 'lodash/fp';
import { contentTypes } from '@strapi/utils';
import { transformResponse } from './transform.mjs';
import { createSingleTypeController } from './single-type.mjs';
import { createCollectionTypeController } from './collection-type.mjs';
import requestCtx from '../../services/request-context.mjs';

const isSingleType = (contentType)=>contentTypes.isSingleType(contentType);
const getAuthFromKoaContext = (ctx)=>prop('state.auth', ctx) ?? {};
function createController({ contentType }) {
    // TODO: replace with Base class + SingleType and CollectionType classes
    const proto = {
        transformResponse (data, meta) {
            const ctx = requestCtx.get();
            return transformResponse(data, meta, {
                contentType,
                useJsonAPIFormat: ctx?.headers?.['strapi-response-format'] === 'v4',
                encodeSourceMaps: ctx?.headers?.['strapi-encode-source-maps'] === 'true'
            });
        },
        async sanitizeOutput (data, ctx) {
            const auth = getAuthFromKoaContext(ctx);
            return strapi.contentAPI.sanitize.output(data, contentType, {
                auth
            });
        },
        async sanitizeInput (data, ctx) {
            const auth = getAuthFromKoaContext(ctx);
            return strapi.contentAPI.sanitize.input(data, contentType, {
                auth
            });
        },
        async sanitizeQuery (ctx) {
            const auth = getAuthFromKoaContext(ctx);
            return strapi.contentAPI.sanitize.query(ctx.query, contentType, {
                auth
            });
        },
        async validateQuery (ctx) {
            const auth = getAuthFromKoaContext(ctx);
            return strapi.contentAPI.validate.query(ctx.query, contentType, {
                auth
            });
        },
        async validateInput (data, ctx) {
            const auth = getAuthFromKoaContext(ctx);
            return strapi.contentAPI.validate.input(data, contentType, {
                auth
            });
        }
    };
    let ctrl;
    if (isSingleType(contentType)) {
        ctrl = createSingleTypeController({
            contentType
        });
    } else {
        ctrl = createCollectionTypeController({
            contentType
        });
    }
    return Object.assign(Object.create(proto), ctrl);
}

export { createController };
//# sourceMappingURL=index.mjs.map
