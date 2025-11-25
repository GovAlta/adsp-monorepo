import { COLLECTION_TYPES } from '../../constants/collections.mjs';
import { contentManagerApi } from '../../services/api.mjs';

const historyVersionsApi = contentManagerApi.injectEndpoints({
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
                            id: collectionType === COLLECTION_TYPES ? `${params.contentType}_${documentId}` : params.contentType
                        }
                    ];
                }
            })
        })
});
const { useGetHistoryVersionsQuery, useRestoreVersionMutation } = historyVersionsApi;

export { useGetHistoryVersionsQuery, useRestoreVersionMutation };
//# sourceMappingURL=historyVersion.mjs.map
