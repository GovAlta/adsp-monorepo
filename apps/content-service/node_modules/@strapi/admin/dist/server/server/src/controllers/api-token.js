'use strict';

var utils = require('@strapi/utils');
var fp = require('lodash/fp');
var index = require('../utils/index.js');
var apiTokens = require('../validation/api-tokens.js');

const { ApplicationError } = utils.errors;
var apiToken = {
    async create (ctx) {
        const { body } = ctx.request;
        const apiTokenService = index.getService('api-token');
        /**
     * We trim both field to avoid having issues with either:
     * - having a space at the end or start of the value.
     * - having only spaces as value;
     */ const attributes = {
            name: fp.trim(body.name),
            description: fp.trim(body.description),
            type: body.type,
            permissions: body.permissions,
            lifespan: body.lifespan
        };
        await apiTokens.validateApiTokenCreationInput(attributes);
        const alreadyExists = await apiTokenService.exists({
            name: attributes.name
        });
        if (alreadyExists) {
            throw new ApplicationError('Name already taken');
        }
        const apiToken = await apiTokenService.create(attributes);
        ctx.created({
            data: apiToken
        });
    },
    async regenerate (ctx) {
        const { id } = ctx.params;
        const apiTokenService = index.getService('api-token');
        const apiTokenExists = await apiTokenService.getById(id);
        if (!apiTokenExists) {
            ctx.notFound('API Token not found');
            return;
        }
        const accessToken = await apiTokenService.regenerate(id);
        ctx.created({
            data: accessToken
        });
    },
    async list (ctx) {
        const apiTokenService = index.getService('api-token');
        const apiTokens = await apiTokenService.list();
        ctx.send({
            data: apiTokens
        });
    },
    async revoke (ctx) {
        const { id } = ctx.params;
        const apiTokenService = index.getService('api-token');
        const apiToken = await apiTokenService.revoke(id);
        ctx.deleted({
            data: apiToken
        });
    },
    async get (ctx) {
        const { id } = ctx.params;
        const apiTokenService = index.getService('api-token');
        const apiToken = await apiTokenService.getById(id);
        if (!apiToken) {
            ctx.notFound('API Token not found');
            return;
        }
        ctx.send({
            data: apiToken
        });
    },
    async update (ctx) {
        const { body } = ctx.request;
        const { id } = ctx.params;
        const apiTokenService = index.getService('api-token');
        const attributes = body;
        /**
     * We trim both field to avoid having issues with either:
     * - having a space at the end or start of the value.
     * - having only spaces as value;
     */ if (fp.has('name', attributes)) {
            attributes.name = fp.trim(body.name);
        }
        if (fp.has('description', attributes) || attributes.description === null) {
            attributes.description = fp.trim(body.description);
        }
        await apiTokens.validateApiTokenUpdateInput(attributes);
        const apiTokenExists = await apiTokenService.getById(id);
        if (!apiTokenExists) {
            return ctx.notFound('API Token not found');
        }
        if (fp.has('name', attributes)) {
            const nameAlreadyTaken = await apiTokenService.getByName(attributes.name);
            /**
       * We cast the ids as string as the one coming from the ctx isn't cast
       * as a Number in case it is supposed to be an integer. It remains
       * as a string. This way we avoid issues with integers in the db.
       */ if (!!nameAlreadyTaken && !utils.strings.isEqual(nameAlreadyTaken.id, id)) {
                throw new ApplicationError('Name already taken');
            }
        }
        const apiToken = await apiTokenService.update(id, attributes);
        ctx.send({
            data: apiToken
        });
    },
    async getLayout (ctx) {
        const apiTokenService = index.getService('api-token');
        // TODO
        // @ts-expect-error remove this controller if not used
        const layout = await apiTokenService.getApiTokenLayout();
        ctx.send({
            data: layout
        });
    }
};

module.exports = apiToken;
//# sourceMappingURL=api-token.js.map
