'use strict';

var utils = require('@strapi/utils');

// TODO: TS - Try to make { policy: { createPolicy } } from '@strapi/utils'; work
const { createPolicy } = utils.policy;
/**
 * This policy is used for routes dealing with telemetry and analytics content.
 * It will fails when the telemetry has been disabled on the server.
 */ var isTelemetryEnabled = createPolicy({
    name: 'admin::isTelemetryEnabled',
    handler (_ctx, _config, { strapi }) {
        if (strapi.telemetry.isDisabled) {
            return false;
        }
    }
});

module.exports = isTelemetryEnabled;
//# sourceMappingURL=isTelemetryEnabled.js.map
