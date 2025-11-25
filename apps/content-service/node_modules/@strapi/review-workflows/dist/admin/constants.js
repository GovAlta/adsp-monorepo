'use strict';

var designSystem = require('@strapi/design-system');

const PLUGIN_ID = 'review-workflows';
/**
 * The name of the feature in the license.
 */ const FEATURE_ID = 'review-workflows';
const CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME = 'numberOfWorkflows';
const CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME = 'stagesPerWorkflow';
const STAGE_COLOR_DEFAULT = designSystem.lightTheme.colors.primary600;

exports.CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME = CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME;
exports.CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME = CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME;
exports.FEATURE_ID = FEATURE_ID;
exports.PLUGIN_ID = PLUGIN_ID;
exports.STAGE_COLOR_DEFAULT = STAGE_COLOR_DEFAULT;
//# sourceMappingURL=constants.js.map
