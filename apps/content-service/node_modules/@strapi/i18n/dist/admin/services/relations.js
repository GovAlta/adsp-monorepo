'use strict';

var api = require('./api.js');

const relationsApi = api.i18nApi.injectEndpoints({
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

exports.useGetManyDraftRelationCountQuery = useGetManyDraftRelationCountQuery;
//# sourceMappingURL=relations.js.map
