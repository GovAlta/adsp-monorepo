'use strict';

var path = require('path');
var packageJson = require('package-json');
var Configstore = require('configstore');
var semver = require('semver');
var boxen = require('boxen');
var chalk = require('chalk');
var strapiUtils = require('@strapi/utils');
var _package = require('../../package.json.js');

const CHECK_INTERVAL = 1000 * 60 * 60 * 24 * 1; // 1 day
const NOTIF_INTERVAL = 1000 * 60 * 60 * 24 * 7; // 1 week
const boxenOptions = {
    padding: 1,
    margin: 1,
    align: 'center',
    borderColor: 'yellow',
    borderStyle: 'round'
};
const getUpdateMessage = (newVersion, currentVersion)=>{
    const currentVersionLog = chalk.dim(currentVersion);
    const newVersionLog = chalk.green(newVersion);
    const releaseLink = chalk.bold('https://github.com/strapi/strapi/releases');
    return `
A new version of Strapi is available ${currentVersionLog} → ${newVersionLog}
Check out the new releases at: ${releaseLink}
`.trim();
};
const createUpdateNotifier = (strapi)=>{
    let config;
    try {
        config = new Configstore(_package.default.name, {}, {
            configPath: path.join(strapi.dirs.app.root, '.strapi-updater.json')
        });
    } catch  {
        // we don't have write access to the file system
        // we silence the error
        return;
    }
    const checkUpdate = async (checkInterval)=>{
        const now = Date.now();
        const lastUpdateCheck = config.get('lastUpdateCheck') || 0;
        if (lastUpdateCheck + checkInterval > now) {
            return;
        }
        try {
            const res = await packageJson(_package.default.name);
            if (res.version) {
                config.set('latest', res.version);
                config.set('lastUpdateCheck', now);
            }
        } catch  {
        // silence error if offline
        }
    };
    const display = (notifInterval)=>{
        const now = Date.now();
        const latestVersion = config.get('latest');
        const lastNotification = config.get('lastNotification') || 0;
        if (!process.stdout.isTTY || lastNotification + notifInterval > now || !semver.valid(latestVersion) || !semver.valid(_package.default.version) || semver.lte(latestVersion, _package.default.version)) {
            return;
        }
        const message = boxen(getUpdateMessage(latestVersion, _package.default.version), boxenOptions);
        config.set('lastNotification', now);
        console.log(message);
    };
    // TODO v6: Remove this warning
    if (strapiUtils.env.bool('STRAPI_DISABLE_UPDATE_NOTIFICATION', false)) {
        strapi.log.warn('STRAPI_DISABLE_UPDATE_NOTIFICATION is no longer supported. Instead, set logger.updates.enabled to false in your server configuration.');
    }
    if (!strapi.config.get('server.logger.updates.enabled') || !config) {
        return;
    }
    display(NOTIF_INTERVAL);
    checkUpdate(CHECK_INTERVAL); // doesn't need to await
};

exports.createUpdateNotifier = createUpdateNotifier;
//# sourceMappingURL=index.js.map
