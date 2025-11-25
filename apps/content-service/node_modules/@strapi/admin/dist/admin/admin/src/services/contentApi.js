'use strict';

var api = require('./api.js');

const contentApiService = api.adminApi.injectEndpoints({
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

exports.useGetPermissionsQuery = useGetPermissionsQuery;
exports.useGetRoutesQuery = useGetRoutesQuery;
//# sourceMappingURL=contentApi.js.map
