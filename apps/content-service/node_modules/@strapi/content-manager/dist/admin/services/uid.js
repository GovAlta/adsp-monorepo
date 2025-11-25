'use strict';

var api = require('./api.js');

const uidApi = api.contentManagerApi.injectEndpoints({
    endpoints: (builder)=>({
            getDefaultUID: builder.query({
                query: ({ params, ...data })=>{
                    return {
                        url: '/content-manager/uid/generate',
                        method: 'POST',
                        data,
                        config: {
                            params
                        }
                    };
                },
                transformResponse: (response)=>response.data
            }),
            generateUID: builder.mutation({
                query: ({ params, ...data })=>({
                        url: '/content-manager/uid/generate',
                        method: 'POST',
                        data,
                        config: {
                            params
                        }
                    }),
                transformResponse: (response)=>response.data
            }),
            getAvailability: builder.query({
                query: ({ params, ...data })=>({
                        url: '/content-manager/uid/check-availability',
                        method: 'POST',
                        data,
                        config: {
                            params
                        }
                    }),
                providesTags: (_res, _error, params)=>[
                        {
                            type: 'UidAvailability',
                            id: params.contentTypeUID
                        }
                    ]
            })
        })
});
const { useGenerateUIDMutation, useGetDefaultUIDQuery, useGetAvailabilityQuery } = uidApi;

exports.useGenerateUIDMutation = useGenerateUIDMutation;
exports.useGetAvailabilityQuery = useGetAvailabilityQuery;
exports.useGetDefaultUIDQuery = useGetDefaultUIDQuery;
//# sourceMappingURL=uid.js.map
