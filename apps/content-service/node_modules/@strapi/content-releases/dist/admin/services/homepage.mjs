import { adminApi } from '@strapi/admin/strapi-admin';

const contentManagerApi = adminApi.enhanceEndpoints({
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

export { useGetUpcomingReleasesQuery };
//# sourceMappingURL=homepage.mjs.map
