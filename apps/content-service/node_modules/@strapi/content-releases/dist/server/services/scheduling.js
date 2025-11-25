'use strict';

var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var constants = require('../constants.js');

const createSchedulingService = ({ strapi })=>{
    const scheduledJobs = new Map();
    return {
        async set (releaseId, scheduleDate) {
            const release = await strapi.db.query(constants.RELEASE_MODEL_UID).findOne({
                where: {
                    id: releaseId,
                    releasedAt: null
                }
            });
            if (!release) {
                throw new utils.errors.NotFoundError(`No release found for id ${releaseId}`);
            }
            const taskName = `publishRelease_${releaseId}`;
            strapi.cron.add({
                [taskName]: {
                    async task () {
                        try {
                            await index.getService('release', {
                                strapi
                            }).publish(releaseId);
                        // @TODO: Trigger webhook with success message
                        } catch (error) {
                        // @TODO: Trigger webhook with error message
                        }
                    },
                    options: scheduleDate
                }
            });
            if (scheduledJobs.has(releaseId)) {
                this.cancel(releaseId);
            }
            scheduledJobs.set(releaseId, taskName);
            return scheduledJobs;
        },
        cancel (releaseId) {
            if (scheduledJobs.has(releaseId)) {
                strapi.cron.remove(scheduledJobs.get(releaseId));
                scheduledJobs.delete(releaseId);
            }
            return scheduledJobs;
        },
        getAll () {
            return scheduledJobs;
        },
        /**
     * On bootstrap, we can use this function to make sure to sync the scheduled jobs from the database that are not yet released
     * This is useful in case the server was restarted and the scheduled jobs were lost
     * This also could be used to sync different Strapi instances in case of a cluster
     */ async syncFromDatabase () {
            const releases = await strapi.db.query(constants.RELEASE_MODEL_UID).findMany({
                where: {
                    scheduledAt: {
                        $gte: new Date()
                    },
                    releasedAt: null
                }
            });
            for (const release of releases){
                this.set(release.id, release.scheduledAt);
            }
            return scheduledJobs;
        }
    };
};

module.exports = createSchedulingService;
//# sourceMappingURL=scheduling.js.map
