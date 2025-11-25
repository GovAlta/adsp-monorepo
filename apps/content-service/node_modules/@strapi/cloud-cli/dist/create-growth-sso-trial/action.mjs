import { cloudApiFactory } from '../services/cli-api.mjs';
import 'fs-extra';
import 'path';
import 'lodash';
import { tokenServiceFactory } from '../services/token.mjs';
import { createLogger } from '../services/logger.mjs';
import { getContext } from '../services/context.mjs';
import { trackEvent } from '../utils/analytics.mjs';

var action = (async ({ strapiVersion })=>{
    const logger = createLogger();
    const { retrieveToken } = await tokenServiceFactory({
        logger
    });
    const token = await retrieveToken();
    if (!token) {
        return;
    }
    const cloudApiService = await cloudApiFactory({
        logger
    }, token);
    try {
        const { data: config } = await cloudApiService.config();
        if (!config?.featureFlags?.growthSsoTrialEnabled) {
            return;
        }
    } catch (e) {
        logger.debug('Failed to get cli config', e);
        return;
    }
    try {
        const response = await cloudApiService.createTrial({
            strapiVersion: strapiVersion || ''
        });
        const ctx = getContext();
        await trackEvent(ctx, cloudApiService, 'didCreateGrowthSsoTrial', {
            strapiVersion: strapiVersion || ''
        });
        return {
            license: response.data?.licenseKey
        };
    } catch (e) {
        logger.debug(e);
        logger.error('We encountered an issue while creating your trial. Please try again in a moment. If the problem persists, contact support for assistance.');
    }
});

export { action as default };
//# sourceMappingURL=action.mjs.map
