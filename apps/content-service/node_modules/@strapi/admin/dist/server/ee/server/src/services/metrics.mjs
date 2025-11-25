import { assign } from 'lodash/fp';
import { getService } from '../utils/index.mjs';

const getSSOProvidersList = async ()=>{
    const { providerRegistry } = strapi.service('admin::passport');
    return providerRegistry.getAll().map(({ uid })=>uid);
};
const sendUpdateProjectInformation = async (strapi1)=>{
    let groupProperties = {};
    const numberOfActiveAdminUsers = await getService('user').count({
        isActive: true
    });
    const numberOfAdminUsers = await getService('user').count();
    if (strapi1.ee.features.isEnabled('sso')) {
        const SSOProviders = await getSSOProvidersList();
        groupProperties = assign(groupProperties, {
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
        groupProperties = assign(groupProperties, {
            numberOfContentReleases,
            numberOfPublishedContentReleases
        });
    }
    groupProperties = assign(groupProperties, {
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

export { metrics as default };
//# sourceMappingURL=metrics.mjs.map
