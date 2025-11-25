'use strict';

var workflows = require('../constants/workflows.js');

/**
 * Set the default color for stages if the color attribute was added
 */ async function migrateReviewWorkflowStagesColor({ oldContentTypes, contentTypes }) {
    // Look for CT's color attribute
    const hadColor = !!oldContentTypes?.[workflows.STAGE_MODEL_UID]?.attributes?.color;
    const hasColor = !!contentTypes?.[workflows.STAGE_MODEL_UID]?.attributes?.color;
    // Add the default stage color if color attribute was added
    if (!hadColor && hasColor) {
        await strapi.db.query(workflows.STAGE_MODEL_UID).updateMany({
            data: {
                color: workflows.STAGE_DEFAULT_COLOR
            }
        });
    }
}

module.exports = migrateReviewWorkflowStagesColor;
//# sourceMappingURL=set-stages-default-color.js.map
