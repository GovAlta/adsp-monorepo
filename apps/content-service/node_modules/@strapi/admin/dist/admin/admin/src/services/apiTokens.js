'use strict';

var api = require('./api.js');

const apiTokensService = api.adminApi.enhanceEndpoints({
    addTagTypes: [
        'ApiToken'
    ]
}).injectEndpoints({
    endpoints: (builder)=>({
            getAPITokens: builder.query({
                query: ()=>'/admin/api-tokens',
                transformResponse: (response)=>response.data,
                providesTags: (res, _err)=>[
                        ...res?.map(({ id })=>({
                                type: 'ApiToken',
                                id
                            })) ?? [],
                        {
                            type: 'ApiToken',
                            id: 'LIST'
                        }
                    ]
            }),
            getAPIToken: builder.query({
                query: (id)=>`/admin/api-tokens/${id}`,
                transformResponse: (response)=>response.data,
                providesTags: (res, _err, id)=>[
                        {
                            type: 'ApiToken',
                            id
                        }
                    ]
            }),
            createAPIToken: builder.mutation({
                query: (body)=>({
                        url: '/admin/api-tokens',
                        method: 'POST',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: [
                    {
                        type: 'ApiToken',
                        id: 'LIST'
                    },
                    'HomepageKeyStatistics'
                ]
            }),
            deleteAPIToken: builder.mutation({
                query: (id)=>({
                        url: `/admin/api-tokens/${id}`,
                        method: 'DELETE'
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: (_res, _err, id)=>[
                        {
                            type: 'ApiToken',
                            id
                        },
                        'HomepageKeyStatistics'
                    ]
            }),
            updateAPIToken: builder.mutation({
                query: ({ id, ...body })=>({
                        url: `/admin/api-tokens/${id}`,
                        method: 'PUT',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: (_res, _err, { id })=>[
                        {
                            type: 'ApiToken',
                            id
                        }
                    ]
            })
        })
});
const { useGetAPITokensQuery, useGetAPITokenQuery, useCreateAPITokenMutation, useDeleteAPITokenMutation, useUpdateAPITokenMutation } = apiTokensService;

exports.useCreateAPITokenMutation = useCreateAPITokenMutation;
exports.useDeleteAPITokenMutation = useDeleteAPITokenMutation;
exports.useGetAPITokenQuery = useGetAPITokenQuery;
exports.useGetAPITokensQuery = useGetAPITokensQuery;
exports.useUpdateAPITokenMutation = useUpdateAPITokenMutation;
//# sourceMappingURL=apiTokens.js.map
