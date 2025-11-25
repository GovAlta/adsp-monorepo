import { getService } from './utils/index.mjs';

const destroy = async ({ strapi })=>{
    const scheduledJobs = getService('scheduling', {
        strapi
    }).getAll();
    for (const [, taskName] of scheduledJobs){
        strapi.cron.remove(taskName);
    }
};

export { destroy };
//# sourceMappingURL=destroy.mjs.map
