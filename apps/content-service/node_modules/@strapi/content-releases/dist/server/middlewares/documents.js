'use strict';

var utils = require('@strapi/utils');
var constants = require('../constants.js');
var index = require('../utils/index.js');

const updateActionsStatusAndUpdateReleaseStatus = async (contentType, entry)=>{
    const releases = await strapi.db.query(constants.RELEASE_MODEL_UID).findMany({
        where: {
            releasedAt: null,
            actions: {
                contentType,
                entryDocumentId: entry.documentId,
                locale: entry.locale
            }
        }
    });
    const entryStatus = await index.isEntryValid(contentType, entry, {
        strapi
    });
    await strapi.db.query(constants.RELEASE_ACTION_MODEL_UID).updateMany({
        where: {
            contentType,
            entryDocumentId: entry.documentId,
            locale: entry.locale
        },
        data: {
            isEntryValid: entryStatus
        }
    });
    for (const release of releases){
        index.getService('release', {
            strapi
        }).updateReleaseStatus(release.id);
    }
};
const deleteActionsAndUpdateReleaseStatus = async (params)=>{
    const releases = await strapi.db.query(constants.RELEASE_MODEL_UID).findMany({
        where: {
            actions: params
        }
    });
    await strapi.db.query(constants.RELEASE_ACTION_MODEL_UID).deleteMany({
        where: params
    });
    for (const release of releases){
        index.getService('release', {
            strapi
        }).updateReleaseStatus(release.id);
    }
};
const deleteActionsOnDelete = async (ctx, next)=>{
    if (ctx.action !== 'delete') {
        return next();
    }
    if (!utils.contentTypes.hasDraftAndPublish(ctx.contentType)) {
        return next();
    }
    const contentType = ctx.contentType.uid;
    const { documentId, locale } = ctx.params;
    const result = await next();
    if (!result) {
        return result;
    }
    try {
        deleteActionsAndUpdateReleaseStatus({
            contentType,
            entryDocumentId: documentId,
            ...locale !== '*' && {
                locale
            }
        });
    } catch (error) {
        strapi.log.error('Error while deleting release actions after delete', {
            error
        });
    }
    return result;
};
const updateActionsOnUpdate = async (ctx, next)=>{
    if (ctx.action !== 'update') {
        return next();
    }
    if (!utils.contentTypes.hasDraftAndPublish(ctx.contentType)) {
        return next();
    }
    const contentType = ctx.contentType.uid;
    const result = await next();
    if (!result) {
        return result;
    }
    try {
        updateActionsStatusAndUpdateReleaseStatus(contentType, result);
    } catch (error) {
        strapi.log.error('Error while updating release actions after update', {
            error
        });
    }
    return result;
};

exports.deleteActionsOnDelete = deleteActionsOnDelete;
exports.updateActionsOnUpdate = updateActionsOnUpdate;
//# sourceMappingURL=documents.js.map
