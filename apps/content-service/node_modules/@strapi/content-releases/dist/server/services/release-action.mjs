import { errors, async } from '@strapi/utils';
import _ from 'lodash/fp';
import { RELEASE_MODEL_UID, RELEASE_ACTION_MODEL_UID } from '../constants.mjs';
import { getService, getDraftEntryValidStatus, getEntry, getEntryStatus } from '../utils/index.mjs';

const getGroupName = (queryValue)=>{
    switch(queryValue){
        case 'contentType':
            return 'contentType.displayName';
        case 'type':
            return 'type';
        case 'locale':
            return _.getOr('No locale', 'locale.name');
        default:
            return 'contentType.displayName';
    }
};
const createReleaseActionService = ({ strapi })=>{
    const getLocalesDataForActions = async ()=>{
        if (!strapi.plugin('i18n')) {
            return {};
        }
        const allLocales = await strapi.plugin('i18n').service('locales').find() || [];
        return allLocales.reduce((acc, locale)=>{
            acc[locale.code] = {
                name: locale.name,
                code: locale.code
            };
            return acc;
        }, {});
    };
    const getContentTypesDataForActions = async (contentTypesUids)=>{
        const contentManagerContentTypeService = strapi.plugin('content-manager').service('content-types');
        const contentTypesData = {};
        for (const contentTypeUid of contentTypesUids){
            const contentTypeConfig = await contentManagerContentTypeService.findConfiguration({
                uid: contentTypeUid
            });
            contentTypesData[contentTypeUid] = {
                mainField: contentTypeConfig.settings.mainField,
                displayName: strapi.getModel(contentTypeUid).info.displayName
            };
        }
        return contentTypesData;
    };
    return {
        async create (releaseId, action, { disableUpdateReleaseStatus = false } = {}) {
            const { validateEntryData, validateUniqueEntry } = getService('release-validation', {
                strapi
            });
            await Promise.all([
                validateEntryData(action.contentType, action.entryDocumentId),
                validateUniqueEntry(releaseId, action)
            ]);
            // If we are adding a singleType, we need to append the documentId of that singleType
            const model = strapi.contentType(action.contentType);
            if (model.kind === 'singleType') {
                const document = await strapi.db.query(model.uid).findOne({
                    select: [
                        'documentId'
                    ]
                });
                if (!document) {
                    throw new errors.NotFoundError(`No entry found for contentType ${action.contentType}`);
                }
                action.entryDocumentId = document.documentId;
            }
            const release = await strapi.db.query(RELEASE_MODEL_UID).findOne({
                where: {
                    id: releaseId
                }
            });
            if (!release) {
                throw new errors.NotFoundError(`No release found for id ${releaseId}`);
            }
            if (release.releasedAt) {
                throw new errors.ValidationError('Release already published');
            }
            // If the action is a publish, check if the entry is valid
            // If the action is an unpublish, skip the validation
            const actionStatus = action.type === 'publish' ? await getDraftEntryValidStatus({
                contentType: action.contentType,
                documentId: action.entryDocumentId,
                locale: action.locale
            }, {
                strapi
            }) : true;
            const releaseAction = await strapi.db.query(RELEASE_ACTION_MODEL_UID).create({
                data: {
                    ...action,
                    release: release.id,
                    isEntryValid: actionStatus
                },
                populate: {
                    release: {
                        select: [
                            'id'
                        ]
                    }
                }
            });
            if (!disableUpdateReleaseStatus) {
                getService('release', {
                    strapi
                }).updateReleaseStatus(release.id);
            }
            return releaseAction;
        },
        async findPage (releaseId, query) {
            const release = await strapi.db.query(RELEASE_MODEL_UID).findOne({
                where: {
                    id: releaseId
                },
                select: [
                    'id'
                ]
            });
            if (!release) {
                throw new errors.NotFoundError(`No release found for id ${releaseId}`);
            }
            const dbQuery = strapi.get('query-params').transform(RELEASE_ACTION_MODEL_UID, query ?? {});
            const { results: actions, pagination } = await strapi.db.query(RELEASE_ACTION_MODEL_UID).findPage({
                ...dbQuery,
                where: {
                    release: releaseId
                }
            });
            // For each contentType on the release, we create a custom populate object for nested relations
            const populateBuilderService = strapi.plugin('content-manager').service('populate-builder');
            const actionsWithEntry = await async.map(actions, async (action)=>{
                // @ts-expect-error - Core.Service type is not a function
                const populate = await populateBuilderService(action.contentType).populateDeep(Infinity).build();
                const entry = await getEntry({
                    contentType: action.contentType,
                    documentId: action.entryDocumentId,
                    locale: action.locale,
                    populate,
                    status: action.type === 'publish' ? 'draft' : 'published'
                }, {
                    strapi
                });
                return {
                    ...action,
                    entry,
                    status: entry ? await getEntryStatus(action.contentType, entry) : null
                };
            });
            return {
                results: actionsWithEntry,
                pagination
            };
        },
        async groupActions (actions, groupBy) {
            const contentTypeUids = actions.reduce((acc, action)=>{
                if (!acc.includes(action.contentType)) {
                    acc.push(action.contentType);
                }
                return acc;
            }, []);
            const allReleaseContentTypesDictionary = await getContentTypesDataForActions(contentTypeUids);
            const allLocalesDictionary = await getLocalesDataForActions();
            const formattedData = actions.map((action)=>{
                const { mainField, displayName } = allReleaseContentTypesDictionary[action.contentType];
                return {
                    ...action,
                    locale: action.locale ? allLocalesDictionary[action.locale] : null,
                    contentType: {
                        displayName,
                        mainFieldValue: action.entry[mainField],
                        uid: action.contentType
                    }
                };
            });
            const groupName = getGroupName(groupBy);
            return _.groupBy(groupName)(formattedData);
        },
        async getContentTypeModelsFromActions (actions) {
            const contentTypeUids = actions.reduce((acc, action)=>{
                if (!acc.includes(action.contentType)) {
                    acc.push(action.contentType);
                }
                return acc;
            }, []);
            const workflowsService = strapi.plugin('review-workflows').service('workflows');
            const contentTypeModelsMap = await async.reduce(contentTypeUids)(async (accPromise, contentTypeUid)=>{
                const acc = await accPromise;
                const contentTypeModel = strapi.getModel(contentTypeUid);
                // Workflows service may not be available depending on the license
                const workflow = await workflowsService?.getAssignedWorkflow(contentTypeUid, {
                    populate: 'stageRequiredToPublish'
                });
                acc[contentTypeUid] = {
                    ...contentTypeModel,
                    hasReviewWorkflow: !!workflow,
                    stageRequiredToPublish: workflow?.stageRequiredToPublish
                };
                return acc;
            }, {});
            return contentTypeModelsMap;
        },
        async countActions (query) {
            const dbQuery = strapi.get('query-params').transform(RELEASE_ACTION_MODEL_UID, query ?? {});
            return strapi.db.query(RELEASE_ACTION_MODEL_UID).count(dbQuery);
        },
        async update (actionId, releaseId, update) {
            const action = await strapi.db.query(RELEASE_ACTION_MODEL_UID).findOne({
                where: {
                    id: actionId,
                    release: {
                        id: releaseId,
                        releasedAt: {
                            $null: true
                        }
                    }
                }
            });
            if (!action) {
                throw new errors.NotFoundError(`Action with id ${actionId} not found in release with id ${releaseId} or it is already published`);
            }
            const actionStatus = update.type === 'publish' ? await getDraftEntryValidStatus({
                contentType: action.contentType,
                documentId: action.entryDocumentId,
                locale: action.locale
            }, {
                strapi
            }) : true;
            const updatedAction = await strapi.db.query(RELEASE_ACTION_MODEL_UID).update({
                where: {
                    id: actionId,
                    release: {
                        id: releaseId,
                        releasedAt: {
                            $null: true
                        }
                    }
                },
                data: {
                    ...update,
                    isEntryValid: actionStatus
                }
            });
            getService('release', {
                strapi
            }).updateReleaseStatus(releaseId);
            return updatedAction;
        },
        async delete (actionId, releaseId) {
            const deletedAction = await strapi.db.query(RELEASE_ACTION_MODEL_UID).delete({
                where: {
                    id: actionId,
                    release: {
                        id: releaseId,
                        releasedAt: {
                            $null: true
                        }
                    }
                }
            });
            if (!deletedAction) {
                throw new errors.NotFoundError(`Action with id ${actionId} not found in release with id ${releaseId} or it is already published`);
            }
            getService('release', {
                strapi
            }).updateReleaseStatus(releaseId);
            return deletedAction;
        },
        async validateActionsByContentTypes (contentTypeUids) {
            const actions = await strapi.db.query(RELEASE_ACTION_MODEL_UID).findMany({
                where: {
                    contentType: {
                        $in: contentTypeUids
                    },
                    // We only want to validate actions that are going to be published
                    type: 'publish',
                    release: {
                        releasedAt: {
                            $null: true
                        }
                    }
                },
                populate: {
                    release: true
                }
            });
            const releasesUpdated = [];
            await async.map(actions, async (action)=>{
                const isValid = await getDraftEntryValidStatus({
                    contentType: action.contentType,
                    documentId: action.entryDocumentId,
                    locale: action.locale
                }, {
                    strapi
                });
                await strapi.db.query(RELEASE_ACTION_MODEL_UID).update({
                    where: {
                        id: action.id
                    },
                    data: {
                        isEntryValid: isValid
                    }
                });
                if (!releasesUpdated.includes(action.release.id)) {
                    releasesUpdated.push(action.release.id);
                }
                return {
                    id: action.id,
                    isEntryValid: isValid
                };
            });
            if (releasesUpdated.length > 0) {
                await async.map(releasesUpdated, async (releaseId)=>{
                    await getService('release', {
                        strapi
                    }).updateReleaseStatus(releaseId);
                });
            }
        }
    };
};

export { createReleaseActionService as default };
//# sourceMappingURL=release-action.mjs.map
