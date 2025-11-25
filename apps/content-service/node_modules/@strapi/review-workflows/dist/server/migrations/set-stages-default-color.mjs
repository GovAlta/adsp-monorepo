import { STAGE_MODEL_UID, STAGE_DEFAULT_COLOR } from '../constants/workflows.mjs';

/**
 * Set the default color for stages if the color attribute was added
 */ async function migrateReviewWorkflowStagesColor({ oldContentTypes, contentTypes }) {
    // Look for CT's color attribute
    const hadColor = !!oldContentTypes?.[STAGE_MODEL_UID]?.attributes?.color;
    const hasColor = !!contentTypes?.[STAGE_MODEL_UID]?.attributes?.color;
    // Add the default stage color if color attribute was added
    if (!hadColor && hasColor) {
        await strapi.db.query(STAGE_MODEL_UID).updateMany({
            data: {
                color: STAGE_DEFAULT_COLOR
            }
        });
    }
}

export { migrateReviewWorkflowStagesColor as default };
//# sourceMappingURL=set-stages-default-color.mjs.map
