'use strict';

var api = require('../../services/api.js');

const previewApi = api.contentManagerApi.injectEndpoints({
    endpoints: (builder)=>({
            getPreviewUrl: builder.query({
                query ({ query, params }) {
                    return {
                        url: `/content-manager/preview/url/${params.contentType}`,
                        method: 'GET',
                        config: {
                            params: query
                        }
                    };
                }
            })
        })
});
const { useGetPreviewUrlQuery } = previewApi;

exports.useGetPreviewUrlQuery = useGetPreviewUrlQuery;
//# sourceMappingURL=preview.js.map
