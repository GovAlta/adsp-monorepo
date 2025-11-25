'use strict';

var fp = require('lodash/fp');
var index = require('../utils/index.js');
var store = require('./utils/store.js');
var configuration = require('./configuration.js');

const STORE_KEY_PREFIX = 'components';
const configurationService = configuration({
    storeUtils: store,
    isComponent: true,
    prefix: STORE_KEY_PREFIX,
    getModels () {
        const { toContentManagerModel } = index.getService('data-mapper');
        return fp.mapValues(toContentManagerModel, strapi.components);
    }
});
var components = (({ strapi: strapi1 })=>({
        findAllComponents () {
            const { toContentManagerModel } = index.getService('data-mapper');
            return Object.values(strapi1.components).map(toContentManagerModel);
        },
        findComponent (uid) {
            const { toContentManagerModel } = index.getService('data-mapper');
            const component = strapi1.components[uid];
            return fp.isNil(component) ? component : toContentManagerModel(component);
        },
        async findConfiguration (component) {
            const configuration = await configurationService.getConfiguration(component.uid);
            return {
                uid: component.uid,
                category: component.category,
                ...configuration
            };
        },
        async updateConfiguration (component, newConfiguration) {
            await configurationService.setConfiguration(component.uid, newConfiguration);
            return this.findConfiguration(component);
        },
        async findComponentsConfigurations (model) {
            const componentsMap = {};
            const getComponentConfigurations = async (uid)=>{
                const component = this.findComponent(uid);
                if (fp.has(uid, componentsMap)) {
                    return;
                }
                const componentConfiguration = await this.findConfiguration(component);
                const componentsConfigurations = await this.findComponentsConfigurations(component);
                Object.assign(componentsMap, {
                    [uid]: componentConfiguration,
                    ...componentsConfigurations
                });
            };
            for (const key of Object.keys(model.attributes)){
                const attribute = model.attributes[key];
                if (attribute.type === 'component') {
                    await getComponentConfigurations(attribute.component);
                }
                if (attribute.type === 'dynamiczone') {
                    for (const componentUid of attribute.components){
                        await getComponentConfigurations(componentUid);
                    }
                }
            }
            return componentsMap;
        },
        syncConfigurations () {
            return configurationService.syncConfigurations();
        }
    }));

module.exports = components;
//# sourceMappingURL=components.js.map
