'use strict';

var index = require('./utils/index.js');

const destroy = async ({ strapi })=>{
    const scheduledJobs = index.getService('scheduling', {
        strapi
    }).getAll();
    for (const [, taskName] of scheduledJobs){
        strapi.cron.remove(taskName);
    }
};

exports.destroy = destroy;
//# sourceMappingURL=destroy.js.map
