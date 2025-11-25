'use strict';

var utils = require('@strapi/utils');
var releaseAction = require('./validation/release-action.js');
var index = require('../utils/index.js');
var constants = require('../constants.js');
var validation = require('../services/validation.js');

const releaseActionController = {
    async create (ctx) {
        const releaseId = ctx.params.releaseId;
        const releaseActionArgs = ctx.request.body;
        await releaseAction.validateReleaseAction(releaseActionArgs);
        const releaseActionService = index.getService('release-action', {
            strapi
        });
        const releaseAction$1 = await releaseActionService.create(releaseId, releaseActionArgs);
        ctx.created({
            data: releaseAction$1
        });
    },
    async createMany (ctx) {
        const releaseId = ctx.params.releaseId;
        const releaseActionsArgs = ctx.request.body;
        await Promise.all(releaseActionsArgs.map((releaseActionArgs)=>releaseAction.validateReleaseAction(releaseActionArgs)));
        const releaseActionService = index.getService('release-action', {
            strapi
        });
        const releaseService = index.getService('release', {
            strapi
        });
        const releaseActions = await strapi.db.transaction(async ()=>{
            const releaseActions = await Promise.all(releaseActionsArgs.map(async (releaseActionArgs)=>{
                try {
                    const action = await releaseActionService.create(releaseId, releaseActionArgs, {
                        disableUpdateReleaseStatus: true
                    });
                    return action;
                } catch (error) {
                    // If the entry is already in the release, we don't want to throw an error, so we catch and ignore it
                    if (error instanceof validation.AlreadyOnReleaseError) {
                        return null;
                    }
                    throw error;
                }
            }));
            return releaseActions;
        });
        const newReleaseActions = releaseActions.filter((action)=>action !== null);
        if (newReleaseActions.length > 0) {
            releaseService.updateReleaseStatus(releaseId);
        }
        ctx.created({
            data: newReleaseActions,
            meta: {
                entriesAlreadyInRelease: releaseActions.length - newReleaseActions.length,
                totalEntries: releaseActions.length
            }
        });
    },
    async findMany (ctx) {
        const releaseId = ctx.params.releaseId;
        const permissionsManager = strapi.service('admin::permission').createPermissionsManager({
            ability: ctx.state.userAbility,
            model: constants.RELEASE_ACTION_MODEL_UID
        });
        await releaseAction.validateFindManyActionsParams(ctx.query);
        if (ctx.query.groupBy) {
            if (![
                'action',
                'contentType',
                'locale'
            ].includes(ctx.query.groupBy)) {
                ctx.badRequest('Invalid groupBy parameter');
            }
        }
        ctx.query.sort = ctx.query.groupBy === 'action' ? 'type' : ctx.query.groupBy;
        delete ctx.query.groupBy;
        const query = await permissionsManager.sanitizeQuery(ctx.query);
        const releaseActionService = index.getService('release-action', {
            strapi
        });
        const { results, pagination } = await releaseActionService.findPage(releaseId, {
            ...query
        });
        /**
     * Release actions can be related to entries of different content types.
     * We need to sanitize the entry output according to that content type.
     * So, we group the sanitized output function by content type.
     */ const contentTypeOutputSanitizers = results.reduce((acc, action)=>{
            if (acc[action.contentType]) {
                return acc;
            }
            const contentTypePermissionsManager = strapi.service('admin::permission').createPermissionsManager({
                ability: ctx.state.userAbility,
                model: action.contentType
            });
            acc[action.contentType] = contentTypePermissionsManager.sanitizeOutput;
            return acc;
        }, {});
        /**
     * sanitizeOutput doesn't work if you use it directly on the Release Action model, it doesn't sanitize the entries
     * So, we need to sanitize manually each entry inside a Release Action
     */ const sanitizedResults = await utils.async.map(results, async (action)=>({
                ...action,
                entry: action.entry ? await contentTypeOutputSanitizers[action.contentType](action.entry) : {}
            }));
        const groupedData = await releaseActionService.groupActions(sanitizedResults, query.sort);
        const contentTypes = await releaseActionService.getContentTypeModelsFromActions(results);
        const releaseService = index.getService('release', {
            strapi
        });
        const components = await releaseService.getAllComponents();
        ctx.body = {
            data: groupedData,
            meta: {
                pagination,
                contentTypes,
                components
            }
        };
    },
    async update (ctx) {
        const actionId = ctx.params.actionId;
        const releaseId = ctx.params.releaseId;
        const releaseActionUpdateArgs = ctx.request.body;
        await releaseAction.validateReleaseActionUpdateSchema(releaseActionUpdateArgs);
        const releaseActionService = index.getService('release-action', {
            strapi
        });
        const updatedAction = await releaseActionService.update(actionId, releaseId, releaseActionUpdateArgs);
        ctx.body = {
            data: updatedAction
        };
    },
    async delete (ctx) {
        const actionId = ctx.params.actionId;
        const releaseId = ctx.params.releaseId;
        const releaseActionService = index.getService('release-action', {
            strapi
        });
        const deletedReleaseAction = await releaseActionService.delete(actionId, releaseId);
        ctx.body = {
            data: deletedReleaseAction
        };
    }
};

module.exports = releaseActionController;
//# sourceMappingURL=release-action.js.map
