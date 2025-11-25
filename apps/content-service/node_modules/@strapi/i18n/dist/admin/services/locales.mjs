import { i18nApi } from './api.mjs';

const localesApi = i18nApi.injectEndpoints({
    endpoints: (builder)=>({
            createLocale: builder.mutation({
                query: (data)=>({
                        url: '/i18n/locales',
                        method: 'POST',
                        data
                    }),
                invalidatesTags: [
                    {
                        type: 'Locale',
                        id: 'LIST'
                    },
                    'HomepageKeyStatistics'
                ]
            }),
            deleteLocale: builder.mutation({
                query: (id)=>({
                        url: `/i18n/locales/${id}`,
                        method: 'DELETE'
                    }),
                invalidatesTags: (result, error, id)=>[
                        {
                            type: 'Locale',
                            id
                        },
                        'HomepageKeyStatistics'
                    ]
            }),
            getLocales: builder.query({
                query: ()=>'/i18n/locales',
                providesTags: (res)=>[
                        {
                            type: 'Locale',
                            id: 'LIST'
                        },
                        ...Array.isArray(res) ? res.map((locale)=>({
                                type: 'Locale',
                                id: locale.id
                            })) : []
                    ]
            }),
            getDefaultLocales: builder.query({
                query: ()=>'/i18n/iso-locales'
            }),
            updateLocale: builder.mutation({
                query: ({ id, ...data })=>({
                        url: `/i18n/locales/${id}`,
                        method: 'PUT',
                        data
                    }),
                invalidatesTags: (result, error, { id })=>[
                        {
                            type: 'Locale',
                            id
                        }
                    ]
            })
        })
});
const { useCreateLocaleMutation, useDeleteLocaleMutation, useGetLocalesQuery, useGetDefaultLocalesQuery, useUpdateLocaleMutation } = localesApi;

export { useCreateLocaleMutation, useDeleteLocaleMutation, useGetDefaultLocalesQuery, useGetLocalesQuery, useUpdateLocaleMutation };
//# sourceMappingURL=locales.mjs.map
