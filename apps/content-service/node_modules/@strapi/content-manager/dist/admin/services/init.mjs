import { contentManagerApi } from './api.mjs';

const initApi = contentManagerApi.injectEndpoints({
    endpoints: (builder)=>({
            getInitialData: builder.query({
                query: ()=>'/content-manager/init',
                transformResponse: (response)=>response.data,
                providesTags: [
                    'InitialData'
                ]
            })
        })
});
const { useGetInitialDataQuery } = initApi;

export { useGetInitialDataQuery };
//# sourceMappingURL=init.mjs.map
