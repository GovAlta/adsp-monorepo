'use strict';

var index = require('../utils/index.js');
require('./validation/index.js');
var modelConfiguration = require('./validation/model-configuration.js');

var components = {
    findComponents (ctx) {
        const components = index.getService('components').findAllComponents();
        const { toDto } = index.getService('data-mapper');
        ctx.body = {
            data: components.map(toDto)
        };
    },
    async findComponentConfiguration (ctx) {
        const { uid } = ctx.params;
        const componentService = index.getService('components');
        const component = componentService.findComponent(uid);
        if (!component) {
            return ctx.notFound('component.notFound');
        }
        const configuration = await componentService.findConfiguration(component);
        const componentsConfigurations = await componentService.findComponentsConfigurations(component);
        ctx.body = {
            data: {
                component: configuration,
                components: componentsConfigurations
            }
        };
    },
    async updateComponentConfiguration (ctx) {
        const { uid } = ctx.params;
        const { body } = ctx.request;
        const componentService = index.getService('components');
        const component = componentService.findComponent(uid);
        if (!component) {
            return ctx.notFound('component.notFound');
        }
        let input;
        try {
            input = await modelConfiguration(component).validate(body, {
                abortEarly: false,
                stripUnknown: true,
                strict: true
            });
        } catch (error) {
            return ctx.badRequest(null, {
                name: 'validationError',
                errors: error.errors
            });
        }
        const newConfiguration = await componentService.updateConfiguration(component, input);
        ctx.body = {
            data: newConfiguration
        };
    }
};

module.exports = components;
//# sourceMappingURL=components.js.map
