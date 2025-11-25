'use strict';

var reducer = require('../reducer.js');
var getFetchClient = require('./getFetchClient.js');

let refreshPromise = null;
const isAuthPath = (url)=>/^\/admin\/(login|logout|access-token)\b/.test(url);
const simpleQuery = async (query, api)=>{
    const { signal, dispatch } = api;
    const executeQuery = async (queryToExecute)=>{
        const { get, post, del, put } = getFetchClient.getFetchClient();
        if (typeof queryToExecute === 'string') {
            const result = await get(queryToExecute, {
                signal
            });
            return result;
        }
        const { url, method = 'GET', data, config } = queryToExecute;
        if (method === 'POST') {
            return post(url, data, {
                ...config,
                signal
            });
        }
        if (method === 'DELETE') {
            return del(url, {
                ...config,
                signal
            });
        }
        if (method === 'PUT') {
            return put(url, data, {
                ...config,
                signal
            });
        }
        return get(url, {
            ...config,
            signal
        });
    };
    try {
        const result = await executeQuery(query);
        return {
            data: result.data
        };
    } catch (err) {
        // Handle error of type FetchError
        if (getFetchClient.isFetchError(err)) {
            // Attempt auto-refresh on 401 then retry once
            if (err.status === 401) {
                const url = typeof query === 'string' ? query : query.url;
                if (!isAuthPath(url)) {
                    if (!refreshPromise) {
                        async function refreshAccessToken() {
                            const { post } = getFetchClient.getFetchClient();
                            const res = await post('/admin/access-token');
                            const token = res?.data?.data?.token;
                            if (!token) {
                                throw new Error('access_token_exchange_failed');
                            }
                            // Persist according to previous choice: localStorage presence implies persist
                            const persist = Boolean(localStorage.getItem('jwtToken'));
                            dispatch(reducer.login({
                                token,
                                persist
                            }));
                            return token;
                        }
                        refreshPromise = refreshAccessToken().finally(()=>{
                            refreshPromise = null;
                        });
                    }
                    try {
                        await refreshPromise;
                        // Retry original request once with updated Authorization
                        const retry = await executeQuery(query);
                        return {
                            data: retry.data
                        };
                    } catch (refreshError) {
                        try {
                            const { post } = getFetchClient.getFetchClient();
                            await post('/admin/logout');
                        } catch  {
                        // no-op
                        }
                        dispatch(reducer.logout());
                    // Fall through to return the original 401 error shape
                    }
                }
            }
            if (typeof err.response?.data === 'object' && err.response?.data !== null && 'error' in err.response?.data) {
                /**
         * This will most likely be ApiError
         */ return {
                    data: undefined,
                    error: err.response?.data.error
                };
            } else {
                return {
                    data: undefined,
                    error: {
                        name: 'UnknownError',
                        message: err.message,
                        details: err.response,
                        status: err.status
                    }
                };
            }
        }
        const error = err;
        return {
            data: undefined,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        };
    }
};
const fetchBaseQuery = ()=>simpleQuery;
const isBaseQueryError = (error)=>{
    return error.name !== undefined;
};

exports.fetchBaseQuery = fetchBaseQuery;
exports.isBaseQueryError = isBaseQueryError;
//# sourceMappingURL=baseQuery.js.map
