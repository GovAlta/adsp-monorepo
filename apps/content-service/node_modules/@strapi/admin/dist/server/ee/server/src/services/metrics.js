'use strict';

var fp = require('lodash/fp');
var index = require('../utils/index.js');

const getSSOProvidersList = async ()=>{
    const { providerRegistry } = strapi.service('admin::passport');
    return providerRegistry.getAll().map(({ uid })=>uid);
};
const sendUpdateProjectInformation = async (strapi1)=>{
    let groupProperties = {};
    const numberOfActiveAdminUsers = await index.getService('user').count({
        isActive: true
    });
    const numberOfAdminUsers = await index.getService('user').count();
    if (strapi1.ee.features.isEnabled('sso')) {
        const SSOProviders = await getSSOProvidersList();
        groupProperties = fp.assign(groupProperties, {
            SSOProviders,
            isSSOConfigured: SSOProviders.length !== 0
        });
    }
    if (strapi1.ee.features.isEnabled('cms-content-releases')) {
        const numberOfContentReleases = await strapi1.db.query('plugin::content-releases.release').count();
        const numberOfPublishedContentReleases = await strapi1.db.query('plugin::content-releases.release').count({
            filters: {
                releasedAt: {
                    $notNull: true
                }
            }
        });
        groupProperties = fp.assign(groupProperties, {
            numberOfContentReleases,
            numberOfPublishedContentReleases
        });
    }
    groupProperties = fp.assign(groupProperties, {
        numberOfActiveAdminUsers,
        numberOfAdminUsers
    });
    strapi1.telemetry.send('didUpdateProjectInformation', {
        groupProperties
    });
};
const startCron = (strapi1)=>{
    strapi1.cron.add({
        sendProjectInformation: {
            task: ()=>sendUpdateProjectInformation(strapi1),
            options: '0 0 0 * * *'
        }
    });
};
var metrics = {
    startCron,
    getSSOProvidersList,
    sendUpdateProjectInformation
};

module.exports = metrics;
//# sourceMappingURL=metrics.js.map
