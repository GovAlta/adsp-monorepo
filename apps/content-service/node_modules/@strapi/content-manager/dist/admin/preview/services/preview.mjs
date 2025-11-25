import { contentManagerApi } from '../../services/api.mjs';

const previewApi = contentManagerApi.injectEndpoints({
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

export { useGetPreviewUrlQuery };
//# sourceMappingURL=preview.mjs.map
