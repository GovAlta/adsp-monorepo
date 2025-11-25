'use strict';

var fp = require('lodash/fp');
var workflows = require('../constants/workflows.js');

const getVisibleContentTypesUID = fp.pipe([
    // Pick only content-types visible in the content-manager and option is not false
    fp.pickBy((value)=>fp.getOr(true, 'pluginOptions.content-manager.visible', value) && !fp.getOr(false, 'options.noStageAttribute', value)),
    // Get UIDs
    fp.keys
]);
const hasStageAttribute = fp.has([
    'attributes',
    workflows.ENTITY_STAGE_ATTRIBUTE
]);
const getWorkflowContentTypeFilter = ({ strapi }, contentType)=>{
    if (strapi.db.dialect.supportsOperator('$jsonSupersetOf')) {
        return {
            $jsonSupersetOf: JSON.stringify([
                contentType
            ])
        };
    }
    return {
        $contains: `"${contentType}"`
    };
};
const clampMaxWorkflows = fp.clamp(1, workflows.MAX_WORKFLOWS);
const clampMaxStagesPerWorkflow = fp.clamp(1, workflows.MAX_STAGES_PER_WORKFLOW);

exports.clampMaxStagesPerWorkflow = clampMaxStagesPerWorkflow;
exports.clampMaxWorkflows = clampMaxWorkflows;
exports.getVisibleContentTypesUID = getVisibleContentTypesUID;
exports.getWorkflowContentTypeFilter = getWorkflowContentTypeFilter;
exports.hasStageAttribute = hasStageAttribute;
//# sourceMappingURL=review-workflows.js.map
