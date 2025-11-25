import { pipe, pickBy, getOr, keys, has, clamp } from 'lodash/fp';
import { ENTITY_STAGE_ATTRIBUTE, MAX_WORKFLOWS, MAX_STAGES_PER_WORKFLOW } from '../constants/workflows.mjs';

const getVisibleContentTypesUID = pipe([
    // Pick only content-types visible in the content-manager and option is not false
    pickBy((value)=>getOr(true, 'pluginOptions.content-manager.visible', value) && !getOr(false, 'options.noStageAttribute', value)),
    // Get UIDs
    keys
]);
const hasStageAttribute = has([
    'attributes',
    ENTITY_STAGE_ATTRIBUTE
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
const clampMaxWorkflows = clamp(1, MAX_WORKFLOWS);
const clampMaxStagesPerWorkflow = clamp(1, MAX_STAGES_PER_WORKFLOW);

export { clampMaxStagesPerWorkflow, clampMaxWorkflows, getVisibleContentTypesUID, getWorkflowContentTypeFilter, hasStageAttribute };
//# sourceMappingURL=review-workflows.mjs.map
