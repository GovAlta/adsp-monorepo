'use strict';

var _ = require('lodash');
var validateLocaleCreation = require('./controllers/validate-locale-creation.js');
var graphql = require('./graphql.js');
var index = require('./utils/index.js');

var register = (({ strapi })=>{
    extendContentTypes(strapi);
    addContentManagerLocaleMiddleware(strapi);
});
// TODO: v5 if implemented in the CM => delete this middleware
/**
 * Adds middleware on CM creation routes to use i18n locale passed in a specific param
 * @param {Strapi} strapi
 */ const addContentManagerLocaleMiddleware = (strapi)=>{
    strapi.server.router.use('/content-manager/collection-types/:model', (ctx, next)=>{
        if (ctx.method === 'POST' || ctx.method === 'PUT') {
            return validateLocaleCreation(ctx, next);
        }
        return next();
    });
    strapi.server.router.use('/content-manager/single-types/:model', (ctx, next)=>{
        if (ctx.method === 'POST' || ctx.method === 'PUT') {
            return validateLocaleCreation(ctx, next);
        }
        return next();
    });
};
/**
 * Adds locale and localization fields to all content types
 * Even if content type is not localized, it will have these fields
 * @param {Strapi} strapi
 */ const extendContentTypes = (strapi)=>{
    const { isLocalizedContentType } = index.getService('content-types');
    Object.values(strapi.contentTypes).forEach((contentType)=>{
        const { attributes } = contentType;
        const isLocalized = isLocalizedContentType(contentType);
        _.set(attributes, 'locale', {
            writable: true,
            private: !isLocalized,
            configurable: false,
            visible: false,
            type: 'string'
        });
        _.set(attributes, 'localizations', {
            type: 'relation',
            relation: 'oneToMany',
            target: contentType.uid,
            writable: false,
            private: !isLocalized,
            configurable: false,
            visible: false,
            unstable_virtual: true,
            joinColumn: {
                name: 'document_id',
                referencedColumn: 'document_id',
                referencedTable: strapi.db.metadata.identifiers.getTableName(contentType.collectionName),
                // ensure the population will not include the results we already loaded
                on ({ results }) {
                    return {
                        id: {
                            $notIn: results.map((r)=>r.id)
                        }
                    };
                }
            }
        });
    });
    if (strapi.plugin('graphql')) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        graphql({
            strapi
        }).register();
    }
};

module.exports = register;
//# sourceMappingURL=register.js.map
