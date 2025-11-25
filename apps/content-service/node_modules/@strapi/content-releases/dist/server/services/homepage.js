'use strict';

const createHomepageService = ({ strapi })=>{
    const MAX_DOCUMENTS = 4;
    return {
        async getUpcomingReleases () {
            const releases = await strapi.db.query('plugin::content-releases.release').findMany({
                filters: {
                    releasedAt: {
                        $notNull: false
                    }
                },
                orderBy: [
                    {
                        scheduledAt: 'asc'
                    }
                ],
                limit: MAX_DOCUMENTS
            });
            return releases;
        }
    };
};

module.exports = createHomepageService;
//# sourceMappingURL=homepage.js.map
