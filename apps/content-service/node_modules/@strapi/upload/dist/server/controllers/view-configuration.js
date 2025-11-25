'use strict';

var index = require('../utils/index.js');
var constants = require('../constants.js');
var configureView = require('./validation/admin/configureView.js');

var viewConfiguration = {
    async updateViewConfiguration (ctx) {
        const { request: { body }, state: { userAbility } } = ctx;
        if (userAbility.cannot(constants.ACTIONS.configureView)) {
            return ctx.forbidden();
        }
        const data = await configureView.validateViewConfiguration(body);
        await index.getService('upload').setConfiguration(data);
        ctx.body = {
            data
        };
    },
    async findViewConfiguration (ctx) {
        const data = await index.getService('upload').getConfiguration();
        ctx.body = {
            data
        };
    }
};

module.exports = viewConfiguration;
//# sourceMappingURL=view-configuration.js.map
