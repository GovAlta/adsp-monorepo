'use strict';

var index = require('../utils/index.js');
var constants = require('../constants.js');
var settings = require('./validation/admin/settings.js');

var adminSettings = {
    async updateSettings (ctx) {
        const { request: { body }, state: { userAbility } } = ctx;
        if (userAbility.cannot(constants.ACTIONS.readSettings, constants.FILE_MODEL_UID)) {
            return ctx.forbidden();
        }
        const data = await settings(body);
        await index.getService('upload').setSettings(data);
        ctx.body = {
            data
        };
    },
    async getSettings (ctx) {
        const { state: { userAbility } } = ctx;
        if (userAbility.cannot(constants.ACTIONS.readSettings, constants.FILE_MODEL_UID)) {
            return ctx.forbidden();
        }
        const data = await index.getService('upload').getSettings();
        ctx.body = {
            data
        };
    }
};

module.exports = adminSettings;
//# sourceMappingURL=admin-settings.js.map
