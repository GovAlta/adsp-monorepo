import { adminApi } from './api.mjs';

const contentApiService = adminApi.injectEndpoints({
    endpoints: (builder)=>({
            getPermissions: builder.query({
                query: ()=>'/admin/content-api/permissions',
                transformResponse: (response)=>response.data
            }),
            getRoutes: builder.query({
                query: ()=>'/admin/content-api/routes',
                transformResponse: (response)=>response.data
            })
        }),
    overrideExisting: false
});
const { useGetPermissionsQuery, useGetRoutesQuery } = contentApiService;

export { useGetPermissionsQuery, useGetRoutesQuery };
//# sourceMappingURL=contentApi.mjs.map
