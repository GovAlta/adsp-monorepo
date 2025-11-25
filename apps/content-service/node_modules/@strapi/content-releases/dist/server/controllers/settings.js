'use strict';

var index = require('../utils/index.js');
var settings = require('./validation/settings.js');

const settingsController = {
    async find (ctx) {
        // Get settings
        const settingsService = index.getService('settings', {
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
        const settings$1 = await settings.validateSettings(settingsBody);
        // Update
        const settingsService = index.getService('settings', {
            strapi
        });
        const updatedSettings = await settingsService.update({
            settings: settings$1
        });
        // Response
        ctx.body = {
            data: updatedSettings
        };
    }
};

module.exports = settingsController;
//# sourceMappingURL=settings.js.map
