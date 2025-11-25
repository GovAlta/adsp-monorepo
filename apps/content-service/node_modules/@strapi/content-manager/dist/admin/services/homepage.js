'use strict';

var api = require('./api.js');

const homepageService = api.contentManagerApi.enhanceEndpoints({
    addTagTypes: [
        'RecentDocumentList'
    ]
}).injectEndpoints({
    /**
     * TODO: Remove overrideExisting when we remove the future flag
     * and delete the old homepage service in the admin
     */ overrideExisting: true,
    endpoints: (builder)=>({
            getRecentDocuments: builder.query({
                query: (params)=>`/content-manager/homepage/recent-documents?action=${params.action}`,
                transformResponse: (response)=>response.data,
                providesTags: (res, _err, { action })=>[
                        {
                            type: 'RecentDocumentList',
                            id: action
                        }
                    ]
            })
        })
});
const { useGetRecentDocumentsQuery } = homepageService;

exports.useGetRecentDocumentsQuery = useGetRecentDocumentsQuery;
//# sourceMappingURL=homepage.js.map
