'use strict';

var path = require('path');
var fse = require('fs-extra');
var fp = require('lodash/fp');
var loadConfigFile = require('../../utils/load-config-file.js');

/**
 * Return user defined plugins' config
 * first load config from `config/plugins.js`
 * and then merge config from `config/env/{env}/plugins.js`
 */ const getUserPluginsConfig = async ()=>{
    const globalUserConfigPath = path.join(strapi.dirs.dist.config, 'plugins.js');
    const currentEnvUserConfigPath = path.join(strapi.dirs.dist.config, 'env', process.env.NODE_ENV, 'plugins.js');
    let config = {};
    // assign global user config if exists
    if (await fse.pathExists(globalUserConfigPath)) {
        config = loadConfigFile.loadConfigFile(globalUserConfigPath);
    }
    // and merge user config by environment if exists
    if (await fse.pathExists(currentEnvUserConfigPath)) {
        config = fp.merge(config, loadConfigFile.loadConfigFile(currentEnvUserConfigPath));
    }
    return config;
};

exports.getUserPluginsConfig = getUserPluginsConfig;
//# sourceMappingURL=get-user-plugins-config.js.map
