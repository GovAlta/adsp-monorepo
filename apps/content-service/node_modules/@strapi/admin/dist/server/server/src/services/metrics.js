'use strict';

var index = require('../utils/index.js');

const sendDidInviteUser = async ()=>{
    const numberOfUsers = await index.getService('user').count();
    const numberOfRoles = await index.getService('role').count();
    strapi.telemetry.send('didInviteUser', {
        groupProperties: {
            numberOfRoles,
            numberOfUsers
        }
    });
};
const sendDidUpdateRolePermissions = async ()=>{
    strapi.telemetry.send('didUpdateRolePermissions');
};
const sendDidChangeInterfaceLanguage = async ()=>{
    const languagesInUse = await index.getService('user').getLanguagesInUse();
    // This event is anonymous
    strapi.telemetry.send('didChangeInterfaceLanguage', {
        userProperties: {
            languagesInUse
        }
    });
};
const sendUpdateProjectInformation = async (strapi1)=>{
    const numberOfActiveAdminUsers = await index.getService('user').count({
        isActive: true
    });
    const numberOfAdminUsers = await index.getService('user').count();
    strapi1.telemetry.send('didUpdateProjectInformation', {
        groupProperties: {
            numberOfActiveAdminUsers,
            numberOfAdminUsers
        }
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
    sendDidInviteUser,
    sendDidUpdateRolePermissions,
    sendDidChangeInterfaceLanguage,
    sendUpdateProjectInformation,
    startCron
};

module.exports = metrics;
//# sourceMappingURL=metrics.js.map
