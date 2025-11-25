'use strict';

var workflows = require('../constants/workflows.js');
var defaultWorkflow = require('../constants/default-workflow.json.js');

/**
 * Multiple workflows introduced the ability to name a workflow.
 * This migration adds the default workflow name if the name attribute was added.
 */ async function migrateReviewWorkflowName({ oldContentTypes, contentTypes }) {
    // Look for RW name attribute
    const hadName = !!oldContentTypes?.[workflows.WORKFLOW_MODEL_UID]?.attributes?.name;
    const hasName = !!contentTypes?.[workflows.WORKFLOW_MODEL_UID]?.attributes?.name;
    // Add the default workflow name if name attribute was added
    if (!hadName && hasName) {
        await strapi.db.query(workflows.WORKFLOW_MODEL_UID).updateMany({
            where: {
                name: {
                    $null: true
                }
            },
            data: {
                name: defaultWorkflow.default.name
            }
        });
    }
}

module.exports = migrateReviewWorkflowName;
//# sourceMappingURL=set-workflow-default-name.js.map
