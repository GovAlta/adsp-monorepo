import { getService } from '../utils/index.mjs';
import { validateSettings } from './validation/settings.mjs';

const settingsController = {
    async find (ctx) {
        // Get settings
        const settingsService = getService('settings', {
            strapi
        });
        const settings = await settingsService.find();
        // Response
        ctx.body = {
            data: settings
        };
    },
    async update (ctx) {
        // Data validation
        const settingsBody = ctx.request.body;
        const settings = await validateSettings(settingsBody);
        // Update
        const settingsService = getService('settings', {
            strapi
        });
        const updatedSettings = await settingsService.update({
            settings
        });
        // Response
        ctx.body = {
            data: updatedSettings
        };
    }
};

export { settingsController as default };
//# sourceMappingURL=settings.mjs.map
