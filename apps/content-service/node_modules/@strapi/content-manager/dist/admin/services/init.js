'use strict';

var api = require('./api.js');

const initApi = api.contentManagerApi.injectEndpoints({
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

exports.useGetInitialDataQuery = useGetInitialDataQuery;
//# sourceMappingURL=init.js.map
