'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');

const contentManagerApi = strapiAdmin.adminApi.enhanceEndpoints({
    addTagTypes: [
        'UpcomingReleasesList'
    ]
}).injectEndpoints({
    endpoints: (builder)=>({
            getUpcomingReleases: builder.query({
                query: ()=>'/content-releases/homepage/upcoming-releases',
                transformResponse: (response)=>response.data,
                providesTags: (_, _err)=>[
                        'UpcomingReleasesList'
                    ]
            })
        }),
    overrideExisting: true
});
const { useGetUpcomingReleasesQuery } = contentManagerApi;

exports.useGetUpcomingReleasesQuery = useGetUpcomingReleasesQuery;
//# sourceMappingURL=homepage.js.map
