import { contentManagerApi } from './api.mjs';

const contentTypesApi = contentManagerApi.injectEndpoints({
    endpoints: (builder)=>({
            getContentTypeConfiguration: builder.query({
                query: (uid)=>({
                        url: `/content-manager/content-types/${uid}/configuration`,
                        method: 'GET'
                    }),
                transformResponse: (response)=>response.data,
                providesTags: (_result, _error, uid)=>[
                        {
                            type: 'ContentTypesConfiguration',
                            id: uid
                        },
                        {
                            type: 'ContentTypeSettings',
                            id: 'LIST'
                        }
                    ]
            }),
            getAllContentTypeSettings: builder.query({
                query: ()=>'/content-manager/content-types-settings',
                transformResponse: (response)=>response.data,
                providesTags: [
                    {
                        type: 'ContentTypeSettings',
                        id: 'LIST'
                    }
                ]
            }),
            updateContentTypeConfiguration: builder.mutation({
                query: ({ uid, ...body })=>({
                        url: `/content-manager/content-types/${uid}/configuration`,
                        method: 'PUT',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: (_result, _error, { uid })=>[
                        {
                            type: 'ContentTypesConfiguration',
                            id: uid
                        },
                        {
                            type: 'ContentTypeSettings',
                            id: 'LIST'
                        },
                        // Is this necessary?
                        {
                            type: 'InitialData'
                        }
                    ]
            })
        })
});
const { useGetContentTypeConfigurationQuery, useGetAllContentTypeSettingsQuery, useUpdateContentTypeConfigurationMutation } = contentTypesApi;

export { useGetAllContentTypeSettingsQuery, useGetContentTypeConfigurationQuery, useUpdateContentTypeConfigurationMutation };
//# sourceMappingURL=contentTypes.mjs.map
