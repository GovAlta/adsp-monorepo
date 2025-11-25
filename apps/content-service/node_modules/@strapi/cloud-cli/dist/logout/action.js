'use strict';

var cliApi = require('../services/cli-api.js');
require('fs-extra');
require('path');
require('lodash');
var token = require('../services/token.js');
require('chalk');
require('fast-safe-stringify');
require('ora');
require('cli-progress');
var analytics = require('../utils/analytics.js');

const openModule = import('open');
var action = (async (ctx)=>{
    const { logger } = ctx;
    const { retrieveToken, eraseToken } = await token.tokenServiceFactory(ctx);
    const token$1 = await retrieveToken();
    if (!token$1) {
        logger.log("You're already logged out.");
        return;
    }
    const cloudApiService = await cliApi.cloudApiFactory(ctx, token$1);
    const config = await cloudApiService.config();
    const cliConfig = config.data;
    try {
        await eraseToken();
        openModule.then((open)=>{
            open.default(`${cliConfig.baseUrl}/oidc/logout?client_id=${encodeURIComponent(cliConfig.clientId)}&logout_hint=${encodeURIComponent(token$1)}
          `).catch((e)=>{
                // Failing to open the logout URL is not a critical error, so we just log it
                logger.debug(e.message, e);
            });
        });
        logger.log('🔌 You have been logged out from the CLI. If you are on a shared computer, please make sure to log out from the Strapi Cloud Dashboard as well.');
    } catch (e) {
        logger.error('🥲 Oops! Something went wrong while logging you out. Please try again.');
        logger.debug(e);
    }
    await analytics.trackEvent(ctx, cloudApiService, 'didLogout', {
        loginMethod: 'cli'
    });
});

module.exports = action;
//# sourceMappingURL=action.js.map
