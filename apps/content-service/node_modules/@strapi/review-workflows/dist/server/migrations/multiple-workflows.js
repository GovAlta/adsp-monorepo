'use strict';

var fp = require('lodash/fp');
var workflows = require('../constants/workflows.js');

async function migrateWorkflowsContentTypes({ oldContentTypes, contentTypes }) {
    // Look for RW contentTypes attribute
    const hadContentTypes = !!oldContentTypes?.[workflows.WORKFLOW_MODEL_UID]?.attributes?.contentTypes;
    const hasContentTypes = !!contentTypes?.[workflows.WORKFLOW_MODEL_UID]?.attributes?.contentTypes;
    if (!hadContentTypes && hasContentTypes) {
        // Initialize contentTypes with an empty array and assign only to one
        // workflow the Content Types which were using Review Workflow before.
        await strapi.db.query(workflows.WORKFLOW_MODEL_UID).updateMany({
            data: {
                contentTypes: []
            }
        });
        // Find Content Types which were using Review Workflow before
        const contentTypes = fp.pipe([
            fp.pickBy(fp.get('options.reviewWorkflows')),
            fp.keys
        ])(oldContentTypes);
        if (contentTypes.length) {
            // Update only one workflow with the contentTypes
            // Before this release there was only one workflow, so this operation is safe.
            await strapi.db.query(workflows.WORKFLOW_MODEL_UID).update({
                where: {
                    id: {
                        $notNull: true
                    }
                },
                data: {
                    contentTypes
                }
            });
        }
    }
}

module.exports = migrateWorkflowsContentTypes;
//# sourceMappingURL=multiple-workflows.js.map
