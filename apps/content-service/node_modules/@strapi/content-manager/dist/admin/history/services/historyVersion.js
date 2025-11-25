'use strict';

var collections = require('../../constants/collections.js');
var api = require('../../services/api.js');

const historyVersionsApi = api.contentManagerApi.injectEndpoints({
    endpoints: (builder)=>({
            getHistoryVersions: builder.query({
                query (params) {
                    return {
                        url: `/content-manager/history-versions`,
                        method: 'GET',
                        config: {
                            params
                        }
                    };
                },
                providesTags: [
                    'HistoryVersion'
                ]
            }),
            restoreVersion: builder.mutation({
                query ({ params, body }) {
                    return {
                        url: `/content-manager/history-versions/${params.versionId}/restore`,
                        method: 'PUT',
                        data: body
                    };
                },
                invalidatesTags: (_res, _error, { documentId, collectionType, params })=>{
                    return [
                        'HistoryVersion',
                        {
                            type: 'Document',
                            id: collectionType === collections.COLLECTION_TYPES ? `${params.contentType}_${documentId}` : params.contentType
                        }
                    ];
                }
            })
        })
});
const { useGetHistoryVersionsQuery, useRestoreVersionMutation } = historyVersionsApi;

exports.useGetHistoryVersionsQuery = useGetHistoryVersionsQuery;
exports.useRestoreVersionMutation = useRestoreVersionMutation;
//# sourceMappingURL=historyVersion.js.map
