'use strict';

var os = require('os');
var path = require('path');
var _ = require('lodash');
var fp = require('lodash/fp');
var dotenv = require('dotenv');
var strapiUtils = require('@strapi/utils');
var urls = require('./urls.js');
var configLoader = require('./config-loader.js');
var getDirs = require('./get-dirs.js');
var _package = require('../package.json.js');

dotenv.config({
    path: process.env.ENV_PATH
});
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const defaultConfig = {
    server: {
        host: process.env.HOST || os.hostname() || 'localhost',
        port: Number(process.env.PORT) || 1337,
        proxy: false,
        cron: {
            enabled: false
        },
        admin: {
            autoOpen: false
        },
        dirs: {
            public: './public'
        },
        transfer: {
            remote: {
                enabled: true
            }
        },
        logger: {
            updates: {
                enabled: true
            },
            startup: {
                enabled: true
            }
        }
    },
    admin: {},
    api: {
        rest: {
            prefix: '/api'
        }
    }
};
const loadConfiguration = (opts)=>{
    const { appDir, distDir, autoReload = false, serveAdminPanel = true } = opts;
    const pkgJSON = require(path.resolve(appDir, 'package.json'));
    const configDir = path.resolve(distDir || process.cwd(), 'config');
    const rootConfig = {
        launchedAt: Date.now(),
        autoReload,
        environment: process.env.NODE_ENV,
        uuid: _.get(pkgJSON, 'strapi.uuid'),
        installId: _.get(pkgJSON, 'strapi.installId'),
        packageJsonStrapi: _.omit(_.get(pkgJSON, 'strapi', {}), 'uuid'),
        info: {
            ...pkgJSON,
            strapi: _package.version
        },
        admin: {
            serveAdminPanel
        }
    };
    // See packages/core/core/src/domain/module/index.ts for plugin config loading
    const baseConfig = fp.omit('plugins', configLoader(configDir)); // plugin config will be loaded later
    const envDir = path.resolve(configDir, 'env', process.env.NODE_ENV);
    const envConfig = configLoader(envDir);
    const config = _.merge(rootConfig, defaultConfig, baseConfig, envConfig);
    const { serverUrl, adminUrl } = urls.getConfigUrls(config);
    const serverAbsoluteUrl = urls.getAbsoluteServerUrl(config);
    const adminAbsoluteUrl = urls.getAbsoluteAdminUrl(config);
    const sameOrigin = new URL(adminAbsoluteUrl).origin === new URL(serverAbsoluteUrl).origin;
    const adminPath = sameOrigin ? adminUrl.replace(strapiUtils.strings.getCommonPath(serverUrl, adminUrl), '') : new URL(adminUrl).pathname;
    _.set(config, 'server.url', serverUrl);
    _.set(config, 'server.absoluteUrl', serverAbsoluteUrl);
    _.set(config, 'admin.url', adminUrl);
    _.set(config, 'admin.path', adminPath);
    _.set(config, 'admin.absoluteUrl', adminAbsoluteUrl);
    _.set(config, 'dirs', getDirs.getDirs(opts, config));
    return config;
};

exports.loadConfiguration = loadConfiguration;
//# sourceMappingURL=index.js.map
