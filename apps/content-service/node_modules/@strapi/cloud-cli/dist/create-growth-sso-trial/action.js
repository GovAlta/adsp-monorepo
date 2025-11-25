'use strict';

var cliApi = require('../services/cli-api.js');
require('fs-extra');
require('path');
require('lodash');
var token = require('../services/token.js');
var logger = require('../services/logger.js');
var context = require('../services/context.js');
var analytics = require('../utils/analytics.js');

var action = (async ({ strapiVersion })=>{
    const logger$1 = logger.createLogger();
    const { retrieveToken } = await token.tokenServiceFactory({
        logger: logger$1
    });
    const token$1 = await retrieveToken();
    if (!token$1) {
        return;
    }
    const cloudApiService = await cliApi.cloudApiFactory({
        logger: logger$1
    }, token$1);
    try {
        const { data: config } = await cloudApiService.config();
        if (!config?.featureFlags?.growthSsoTrialEnabled) {
            return;
        }
    } catch (e) {
        logger$1.debug('Failed to get cli config', e);
        return;
    }
    try {
        const response = await cloudApiService.createTrial({
            strapiVersion: strapiVersion || ''
        });
        const ctx = context.getContext();
        await analytics.trackEvent(ctx, cloudApiService, 'didCreateGrowthSsoTrial', {
            strapiVersion: strapiVersion || ''
        });
        return {
            license: response.data?.licenseKey
        };
    } catch (e) {
        logger$1.debug(e);
        logger$1.error('We encountered an issue while creating your trial. Please try again in a moment. If the problem persists, contact support for assistance.');
    }
});

module.exports = action;
//# sourceMappingURL=action.js.map
