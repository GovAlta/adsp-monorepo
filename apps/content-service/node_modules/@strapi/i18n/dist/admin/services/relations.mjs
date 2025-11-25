import { i18nApi } from './api.mjs';

const relationsApi = i18nApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder)=>({
            getManyDraftRelationCount: builder.query({
                query: ({ model, ...params })=>({
                        url: `/content-manager/collection-types/${model}/actions/countManyEntriesDraftRelations`,
                        method: 'GET',
                        config: {
                            params
                        }
                    }),
                transformResponse: (response)=>response.data
            })
        })
});
const { useGetManyDraftRelationCountQuery } = relationsApi;

export { useGetManyDraftRelationCountQuery };
//# sourceMappingURL=relations.mjs.map
