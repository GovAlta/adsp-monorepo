'use strict';

require('react');
var immer = require('immer');

class Plugin {
    getInjectedComponents(containerName, blockName) {
        try {
            return this.injectionZones[containerName][blockName] || [];
        } catch (err) {
            console.error('Cannot get injected component', err);
            return [];
        }
    }
    injectComponent(containerName, blockName, component) {
        try {
            this.injectionZones[containerName][blockName].push(component);
        } catch (err) {
            console.error('Cannot inject component', err);
        }
    }
    constructor(pluginConf){
        this[immer.immerable] = true;
        this.apis = pluginConf.apis || {};
        this.initializer = pluginConf.initializer || null;
        this.injectionZones = pluginConf.injectionZones || {};
        this.isReady = pluginConf.isReady !== undefined ? pluginConf.isReady : true;
        this.name = pluginConf.name;
        this.pluginId = pluginConf.id;
    }
}

exports.Plugin = Plugin;
//# sourceMappingURL=Plugin.js.map
