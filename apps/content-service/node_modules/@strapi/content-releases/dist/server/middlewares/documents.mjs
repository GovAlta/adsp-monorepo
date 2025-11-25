import { contentTypes } from '@strapi/utils';
import { RELEASE_MODEL_UID, RELEASE_ACTION_MODEL_UID } from '../constants.mjs';
import { isEntryValid, getService } from '../utils/index.mjs';

const updateActionsStatusAndUpdateReleaseStatus = async (contentType, entry)=>{
    const releases = await strapi.db.query(RELEASE_MODEL_UID).findMany({
        where: {
            releasedAt: null,
            actions: {
                contentType,
                entryDocumentId: entry.documentId,
                locale: entry.locale
            }
        }
    });
    const entryStatus = await isEntryValid(contentType, entry, {
        strapi
    });
    await strapi.db.query(RELEASE_ACTION_MODEL_UID).updateMany({
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
        getService('release', {
            strapi
        }).updateReleaseStatus(release.id);
    }
};
const deleteActionsAndUpdateReleaseStatus = async (params)=>{
    const releases = await strapi.db.query(RELEASE_MODEL_UID).findMany({
        where: {
            actions: params
        }
    });
    await strapi.db.query(RELEASE_ACTION_MODEL_UID).deleteMany({
        where: params
    });
    for (const release of releases){
        getService('release', {
            strapi
        }).updateReleaseStatus(release.id);
    }
};
const deleteActionsOnDelete = async (ctx, next)=>{
    if (ctx.action !== 'delete') {
        return next();
    }
    if (!contentTypes.hasDraftAndPublish(ctx.contentType)) {
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
    if (!contentTypes.hasDraftAndPublish(ctx.contentType)) {
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

export { deleteActionsOnDelete, updateActionsOnUpdate };
//# sourceMappingURL=documents.mjs.map
