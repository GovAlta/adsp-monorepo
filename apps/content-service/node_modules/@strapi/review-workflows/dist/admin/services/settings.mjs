import { reviewWorkflowsApi } from './api.mjs';

const settingsApi = reviewWorkflowsApi.injectEndpoints({
    endpoints: (builder)=>({
            getWorkflows: builder.query({
                query: (args)=>{
                    return {
                        url: '/review-workflows/workflows',
                        method: 'GET',
                        config: {
                            params: args ?? {}
                        }
                    };
                },
                transformResponse: (res)=>{
                    return {
                        workflows: res.data,
                        meta: 'meta' in res ? res.meta : undefined
                    };
                },
                providesTags: (res)=>{
                    return [
                        ...res?.workflows.map(({ id })=>({
                                type: 'ReviewWorkflow',
                                id
                            })) ?? [],
                        {
                            type: 'ReviewWorkflow',
                            id: 'LIST'
                        }
                    ];
                }
            }),
            createWorkflow: builder.mutation({
                query: (data)=>({
                        url: '/review-workflows/workflows',
                        method: 'POST',
                        data
                    }),
                transformResponse: (res)=>res.data,
                invalidatesTags (res) {
                    return [
                        {
                            type: 'ReviewWorkflow',
                            id: 'LIST'
                        },
                        'ReviewWorkflowStages',
                        {
                            type: 'Document',
                            id: `ALL_LIST`
                        },
                        {
                            type: 'ContentTypeSettings',
                            id: 'LIST'
                        },
                        ...res?.contentTypes.map((uid)=>({
                                type: 'Document',
                                id: `${uid}_ALL_ITEMS`
                            })) ?? []
                    ];
                }
            }),
            updateWorkflow: builder.mutation({
                query: ({ id, ...data })=>({
                        url: `/review-workflows/workflows/${id}`,
                        method: 'PUT',
                        data
                    }),
                transformResponse: (res)=>res.data,
                invalidatesTags: (res, _err, arg)=>[
                        {
                            type: 'ReviewWorkflow',
                            id: arg.id
                        },
                        'ReviewWorkflowStages',
                        {
                            type: 'Document',
                            id: 'ALL_LIST'
                        },
                        {
                            type: 'ContentTypeSettings',
                            id: 'LIST'
                        },
                        ...res?.contentTypes.map((uid)=>({
                                type: 'Document',
                                id: `${uid}_ALL_ITEMS`
                            })) ?? []
                    ]
            }),
            deleteWorkflow: builder.mutation({
                query: ({ id })=>({
                        url: `/review-workflows/workflows/${id}`,
                        method: 'DELETE'
                    }),
                transformResponse: (res)=>res.data,
                invalidatesTags: (res, _err, arg)=>[
                        {
                            type: 'ReviewWorkflow',
                            id: arg.id
                        },
                        'ReviewWorkflowStages',
                        {
                            type: 'Document',
                            id: `ALL_LIST`
                        },
                        {
                            type: 'ContentTypeSettings',
                            id: 'LIST'
                        }
                    ]
            })
        }),
    overrideExisting: false
});
const { useGetWorkflowsQuery, useCreateWorkflowMutation, useDeleteWorkflowMutation, useUpdateWorkflowMutation } = settingsApi;

export { useCreateWorkflowMutation, useDeleteWorkflowMutation, useGetWorkflowsQuery, useUpdateWorkflowMutation };
//# sourceMappingURL=settings.mjs.map
