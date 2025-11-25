'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var transform = require('./transform.js');
var singleType = require('./single-type.js');
var collectionType = require('./collection-type.js');
var requestContext = require('../../services/request-context.js');

const isSingleType = (contentType)=>strapiUtils.contentTypes.isSingleType(contentType);
const getAuthFromKoaContext = (ctx)=>fp.prop('state.auth', ctx) ?? {};
function createController({ contentType }) {
    // TODO: replace with Base class + SingleType and CollectionType classes
    const proto = {
        transformResponse (data, meta) {
            const ctx = requestContext.get();
            return transform.transformResponse(data, meta, {
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
        ctrl = singleType.createSingleTypeController({
            contentType
        });
    } else {
        ctrl = collectionType.createCollectionTypeController({
            contentType
        });
    }
    return Object.assign(Object.create(proto), ctrl);
}

exports.createController = createController;
//# sourceMappingURL=index.js.map
