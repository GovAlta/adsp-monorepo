const getService = (name, { strapi: strapi1 })=>{
    return strapi1.plugin('content-releases').service(name);
};
const getDraftEntryValidStatus = async ({ contentType, documentId, locale }, { strapi: strapi1 })=>{
    const populateBuilderService = strapi1.plugin('content-manager').service('populate-builder');
    // @ts-expect-error - populateBuilderService should be a function but is returning service
    const populate = await populateBuilderService(contentType).populateDeep(Infinity).build();
    const entry = await getEntry({
        contentType,
        documentId,
        locale,
        populate
    }, {
        strapi: strapi1
    });
    return isEntryValid(contentType, entry, {
        strapi: strapi1
    });
};
const isEntryValid = async (contentTypeUid, entry, { strapi: strapi1 })=>{
    try {
        // @TODO: When documents service has validateEntityCreation method, use it instead
        await strapi1.entityValidator.validateEntityCreation(strapi1.getModel(contentTypeUid), entry, undefined, // @ts-expect-error - FIXME: entity here is unnecessary
        entry);
        const workflowsService = strapi1.plugin('review-workflows').service('workflows');
        // Workflows service may not be available depending on the license
        const workflow = await workflowsService?.getAssignedWorkflow(contentTypeUid, {
            populate: 'stageRequiredToPublish'
        });
        if (workflow?.stageRequiredToPublish) {
            return entry.strapi_stage.id === workflow.stageRequiredToPublish.id;
        }
        return true;
    } catch  {
        return false;
    }
};
const getEntry = async ({ contentType, documentId, locale, populate, status = 'draft' }, { strapi: strapi1 })=>{
    if (documentId) {
        // Try to get an existing draft or published document
        const entry = await strapi1.documents(contentType).findOne({
            documentId,
            locale,
            populate,
            status
        });
        // The document isn't published yet, but the action is to publish it, fetch the draft
        if (status === 'published' && !entry) {
            return strapi1.documents(contentType).findOne({
                documentId,
                locale,
                populate,
                status: 'draft'
            });
        }
        return entry;
    }
    return strapi1.documents(contentType).findFirst({
        locale,
        populate,
        status
    });
};
const getEntryStatus = async (contentType, entry)=>{
    if (entry.publishedAt) {
        return 'published';
    }
    const publishedEntry = await strapi.documents(contentType).findOne({
        documentId: entry.documentId,
        locale: entry.locale,
        status: 'published',
        fields: [
            'updatedAt'
        ]
    });
    if (!publishedEntry) {
        return 'draft';
    }
    const entryUpdatedAt = new Date(entry.updatedAt).getTime();
    const publishedEntryUpdatedAt = new Date(publishedEntry.updatedAt).getTime();
    if (entryUpdatedAt > publishedEntryUpdatedAt) {
        return 'modified';
    }
    return 'published';
};

export { getDraftEntryValidStatus, getEntry, getEntryStatus, getService, isEntryValid };
//# sourceMappingURL=index.mjs.map
