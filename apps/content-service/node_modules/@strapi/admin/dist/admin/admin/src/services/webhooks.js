'use strict';

var api = require('./api.js');

const webhooksSerivce = api.adminApi.enhanceEndpoints({
    addTagTypes: [
        'Webhook'
    ]
}).injectEndpoints({
    endpoints: (builder)=>({
            getWebhooks: builder.query({
                query: (args)=>({
                        url: `/admin/webhooks/${args?.id ?? ''}`,
                        method: 'GET'
                    }),
                transformResponse: (response)=>{
                    if (Array.isArray(response.data)) {
                        return response.data;
                    } else {
                        return [
                            response.data
                        ];
                    }
                },
                providesTags: (res, _err, arg)=>{
                    if (typeof arg === 'object' && 'id' in arg) {
                        return [
                            {
                                type: 'Webhook',
                                id: arg.id
                            }
                        ];
                    } else {
                        return [
                            ...res?.map(({ id })=>({
                                    type: 'Webhook',
                                    id
                                })) ?? [],
                            {
                                type: 'Webhook',
                                id: 'LIST'
                            }
                        ];
                    }
                }
            }),
            createWebhook: builder.mutation({
                query: (body)=>({
                        url: `/admin/webhooks`,
                        method: 'POST',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: [
                    {
                        type: 'Webhook',
                        id: 'LIST'
                    },
                    'HomepageKeyStatistics'
                ]
            }),
            updateWebhook: builder.mutation({
                query: ({ id, ...body })=>({
                        url: `/admin/webhooks/${id}`,
                        method: 'PUT',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: (_res, _err, { id })=>[
                        {
                            type: 'Webhook',
                            id
                        }
                    ]
            }),
            triggerWebhook: builder.mutation({
                query: (webhookId)=>({
                        url: `/admin/webhooks/${webhookId}/trigger`,
                        method: 'POST'
                    }),
                transformResponse: (response)=>response.data
            }),
            deleteManyWebhooks: builder.mutation({
                query: (body)=>({
                        url: `/admin/webhooks/batch-delete`,
                        method: 'POST',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: (_res, _err, { ids })=>[
                        ...ids.map((id)=>({
                                type: 'Webhook',
                                id
                            })),
                        'HomepageKeyStatistics'
                    ]
            })
        }),
    overrideExisting: false
});
const { useGetWebhooksQuery, useCreateWebhookMutation, useUpdateWebhookMutation, useTriggerWebhookMutation, useDeleteManyWebhooksMutation } = webhooksSerivce;

exports.useCreateWebhookMutation = useCreateWebhookMutation;
exports.useDeleteManyWebhooksMutation = useDeleteManyWebhooksMutation;
exports.useGetWebhooksQuery = useGetWebhooksQuery;
exports.useTriggerWebhookMutation = useTriggerWebhookMutation;
exports.useUpdateWebhookMutation = useUpdateWebhookMutation;
//# sourceMappingURL=webhooks.js.map
