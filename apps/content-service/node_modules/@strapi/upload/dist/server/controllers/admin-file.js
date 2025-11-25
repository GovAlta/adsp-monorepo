'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var constants = require('../constants.js');
var findEntityAndCheckPermissions = require('./utils/find-entity-and-check-permissions.js');

var adminFile = {
    async find (ctx) {
        const { state: { userAbility } } = ctx;
        const defaultQuery = {
            populate: {
                folder: true
            }
        };
        const pm = strapi.service('admin::permission').createPermissionsManager({
            ability: userAbility,
            action: constants.ACTIONS.read,
            model: constants.FILE_MODEL_UID
        });
        if (!pm.isAllowed) {
            return ctx.forbidden();
        }
        // validate the incoming user query params
        await pm.validateQuery(ctx.query);
        const query = await utils.async.pipe(// Start by sanitizing the incoming query
        (q)=>pm.sanitizeQuery(q), // Add the default query which should not be validated or sanitized
        (q)=>fp.merge(defaultQuery, q), // Add the dynamic filters based on permissions' conditions
        (q)=>pm.addPermissionsQueryTo(q))(ctx.query);
        const { results: files, pagination } = await index.getService('upload').findPage(query);
        // Sign file urls for private providers
        const signedFiles = await utils.async.map(files, index.getService('file').signFileUrls);
        const sanitizedFiles = await pm.sanitizeOutput(signedFiles);
        return {
            results: sanitizedFiles,
            pagination
        };
    },
    async findOne (ctx) {
        const { state: { userAbility }, params: { id } } = ctx;
        const { pm, file } = await findEntityAndCheckPermissions.findEntityAndCheckPermissions(userAbility, constants.ACTIONS.read, constants.FILE_MODEL_UID, id);
        const signedFile = await index.getService('file').signFileUrls(file);
        ctx.body = await pm.sanitizeOutput(signedFile);
    },
    async destroy (ctx) {
        const { id } = ctx.params;
        const { userAbility } = ctx.state;
        const { pm, file } = await findEntityAndCheckPermissions.findEntityAndCheckPermissions(userAbility, constants.ACTIONS.update, constants.FILE_MODEL_UID, id);
        const [body] = await Promise.all([
            pm.sanitizeOutput(file, {
                action: constants.ACTIONS.read
            }),
            index.getService('upload').remove(file)
        ]);
        ctx.body = body;
    }
};

module.exports = adminFile;
//# sourceMappingURL=admin-file.js.map
