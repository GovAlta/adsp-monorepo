import { contentManagerApi } from './api.mjs';

const componentsApi = contentManagerApi.injectEndpoints({
    endpoints: (builder)=>({
            getComponentConfiguration: builder.query({
                query: (uid)=>`/content-manager/components/${uid}/configuration`,
                transformResponse: (response)=>response.data,
                providesTags: (_result, _error, uid)=>[
                        {
                            type: 'ComponentConfiguration',
                            id: uid
                        }
                    ]
            }),
            updateComponentConfiguration: builder.mutation({
                query: ({ uid, ...body })=>({
                        url: `/content-manager/components/${uid}/configuration`,
                        method: 'PUT',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: (_result, _error, { uid })=>[
                        {
                            type: 'ComponentConfiguration',
                            id: uid
                        },
                        // otherwise layouts already fetched will have stale component configuration data.
                        {
                            type: 'ContentTypeSettings',
                            id: 'LIST'
                        }
                    ]
            })
        })
});
const { useGetComponentConfigurationQuery, useUpdateComponentConfigurationMutation } = componentsApi;

export { useGetComponentConfigurationQuery, useUpdateComponentConfigurationMutation };
//# sourceMappingURL=components.mjs.map
