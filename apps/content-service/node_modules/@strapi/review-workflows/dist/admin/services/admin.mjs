import { reviewWorkflowsApi } from './api.mjs';

const adminApi = reviewWorkflowsApi.injectEndpoints({
    endpoints (builder) {
        return {
            getAdminRoles: builder.query({
                query: ()=>({
                        url: `/admin/roles`,
                        method: 'GET'
                    }),
                transformResponse: (res)=>{
                    return res.data;
                }
            })
        };
    }
});
const { useGetAdminRolesQuery } = adminApi;

export { useGetAdminRolesQuery };
//# sourceMappingURL=admin.mjs.map
