'use strict';

var _ = require('lodash');
var index = require('../utils/index.js');
var contentType = require('./validation/content-type.js');

var contentTypes = {
    async getContentTypes (ctx) {
        const { kind } = ctx.query;
        try {
            await contentType.validateKind(kind);
        } catch (error) {
            return ctx.send({
                error
            }, 400);
        }
        const contentTypeService = index.getService('content-types');
        const contentTypes = Object.keys(strapi.contentTypes).filter((uid)=>!kind || _.get(strapi.contentTypes[uid], 'kind', 'collectionType') === kind).map((uid)=>contentTypeService.formatContentType(strapi.contentTypes[uid]));
        ctx.send({
            data: contentTypes
        });
    },
    getContentType (ctx) {
        const { uid } = ctx.params;
        const contentType = strapi.contentTypes[uid];
        if (!contentType) {
            return ctx.send({
                error: 'contentType.notFound'
            }, 404);
        }
        const contentTypeService = index.getService('content-types');
        ctx.send({
            data: contentTypeService.formatContentType(contentType)
        });
    },
    async createContentType (ctx) {
        const body = ctx.request.body;
        try {
            await contentType.validateContentTypeInput(body);
        } catch (error) {
            return ctx.send({
                error
            }, 400);
        }
        try {
            strapi.reload.isWatching = false;
            const contentTypeService = index.getService('content-types');
            const contentType = await contentTypeService.createContentType({
                contentType: body.contentType,
                components: body.components
            });
            const metricsPayload = {
                eventProperties: {
                    kind: contentType.kind
                }
            };
            if (_.isEmpty(strapi.apis)) {
                await strapi.telemetry.send('didCreateFirstContentType', metricsPayload);
            } else {
                await strapi.telemetry.send('didCreateContentType', metricsPayload);
            }
            setImmediate(()=>strapi.reload());
            ctx.send({
                data: {
                    uid: contentType.uid
                }
            }, 201);
        } catch (err) {
            strapi.log.error(err);
            await strapi.telemetry.send('didNotCreateContentType', {
                eventProperties: {
                    error: err.message || err
                }
            });
            ctx.send({
                error: err.message || 'Unknown error'
            }, 400);
        }
    },
    async updateContentType (ctx) {
        const { uid } = ctx.params;
        const body = ctx.request.body;
        if (!_.has(strapi.contentTypes, uid)) {
            return ctx.send({
                error: 'contentType.notFound'
            }, 404);
        }
        try {
            await contentType.validateUpdateContentTypeInput(body);
        } catch (error) {
            return ctx.send({
                error
            }, 400);
        }
        try {
            strapi.reload.isWatching = false;
            const contentTypeService = index.getService('content-types');
            const component = await contentTypeService.editContentType(uid, {
                contentType: body.contentType,
                components: body.components
            });
            setImmediate(()=>strapi.reload());
            ctx.send({
                data: {
                    uid: component.uid
                }
            }, 201);
        } catch (error) {
            strapi.log.error(error);
            ctx.send({
                error: error?.message || 'Unknown error'
            }, 400);
        }
    },
    async deleteContentType (ctx) {
        const { uid } = ctx.params;
        if (!_.has(strapi.contentTypes, uid)) {
            return ctx.send({
                error: 'contentType.notFound'
            }, 404);
        }
        try {
            strapi.reload.isWatching = false;
            const contentTypeService = index.getService('content-types');
            const component = await contentTypeService.deleteContentType(uid);
            setImmediate(()=>strapi.reload());
            ctx.send({
                data: {
                    uid: component.uid
                }
            });
        } catch (error) {
            strapi.log.error(error);
            ctx.send({
                error: error?.message || 'Unknown error'
            }, 400);
        }
    }
};

module.exports = contentTypes;
//# sourceMappingURL=content-types.js.map
