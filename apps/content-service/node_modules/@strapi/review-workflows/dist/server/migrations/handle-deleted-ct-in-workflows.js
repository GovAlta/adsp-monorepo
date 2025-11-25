'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var workflows = require('../constants/workflows.js');
var reviewWorkflows = require('../utils/review-workflows.js');

/**
 * Remove CT references from workflows if the CT is deleted
 */ async function migrateDeletedCTInWorkflows({ oldContentTypes, contentTypes }) {
    const deletedContentTypes = fp.difference(fp.keys(oldContentTypes), fp.keys(contentTypes)) ?? [];
    if (deletedContentTypes.length) {
        await utils.async.map(deletedContentTypes, async (deletedContentTypeUID)=>{
            const workflow = await strapi.db.query(workflows.WORKFLOW_MODEL_UID).findOne({
                select: [
                    'id',
                    'contentTypes'
                ],
                where: {
                    contentTypes: reviewWorkflows.getWorkflowContentTypeFilter({
                        strapi
                    }, deletedContentTypeUID)
                }
            });
            if (workflow) {
                await strapi.db.query(workflows.WORKFLOW_MODEL_UID).update({
                    where: {
                        id: workflow.id
                    },
                    data: {
                        contentTypes: workflow.contentTypes.filter((contentTypeUID)=>contentTypeUID !== deletedContentTypeUID)
                    }
                });
            }
        });
    }
}

module.exports = migrateDeletedCTInWorkflows;
//# sourceMappingURL=handle-deleted-ct-in-workflows.js.map
