'use strict';

var pipe = require('lodash/fp/pipe');
var qs = require('qs');
var cookies = require('./cookies.js');

const STORAGE_KEYS = {
    TOKEN: 'jwtToken',
    USER: 'userInfo'
};
class FetchError extends Error {
    constructor(message, response){
        super(message);
        this.name = 'FetchError';
        this.message = message;
        this.response = response;
        this.code = response?.data?.error?.status;
        this.status = response?.data?.error?.status;
        // Ensure correct stack trace in error object
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FetchError);
        }
    }
}
const isFetchError = (error)=>{
    return error instanceof FetchError;
};
const getToken = ()=>{
    const fromLocalStorage = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (fromLocalStorage) {
        return JSON.parse(fromLocalStorage);
    }
    const fromCookie = cookies.getCookieValue(STORAGE_KEYS.TOKEN);
    return fromCookie ?? null;
};
/**
 * @public
 * @param {FetchConfig} [defaultOptions={}] - Fetch Configs.
 * @returns {FetchClient} A fetch client object with methods for making HTTP requests.
 * @description This is an abstraction around the native fetch exposed by a function. It provides a simple interface to handle API calls
 * to the Strapi backend.
 * @example
 * ```tsx
 * import { getFetchClient } from '@strapi/admin/admin';
 *
 * const myFunct = () => {
 *   const { get } = getFetchClient();
 *   const requestURL = "/some-endpoint";
 *
 *   const { data } = await get(requestURL);
 *
 *   return data;
 * };
 * ```
 */ const getFetchClient = (defaultOptions = {})=>{
    const backendURL = window.strapi.backendURL;
    const defaultHeader = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
    };
    const isFormDataRequest = (body)=>body instanceof FormData;
    const addPrependingSlash = (url)=>url.charAt(0) !== '/' ? `/${url}` : url;
    // This regular expression matches a string that starts with either "http://" or "https://" or any other protocol name in lower case letters, followed by "://" and ends with anything else
    const hasProtocol = (url)=>new RegExp('^(?:[a-z+]+:)?//', 'i').test(url);
    // Check if the url has a prepending slash, if not add a slash
    const normalizeUrl = (url)=>hasProtocol(url) ? url : addPrependingSlash(url);
    // Add a response interceptor to return the response
    const responseInterceptor = async (response, validateStatus)=>{
        try {
            const result = await response.json();
            /**
       * validateStatus allows us to customize when a response should throw an error
       * In native Fetch API, a response is considered "not ok"
       * when the status code falls in the 200 to 299 (inclusive) range
       */ if (!response.ok && result.error && !validateStatus?.(response.status)) {
                throw new FetchError(result.error.message, {
                    data: result
                });
            }
            if (!response.ok && !validateStatus?.(response.status)) {
                throw new FetchError('Unknown Server Error');
            }
            return {
                data: result
            };
        } catch (error) {
            if (error instanceof SyntaxError && response.ok) {
                // Making sure that a SyntaxError doesn't throw if it's successful
                return {
                    data: [],
                    status: response.status
                };
            } else {
                throw error;
            }
        }
    };
    const paramsSerializer = (params)=>(url)=>{
            if (params) {
                if (typeof params === 'string') {
                    return `${url}?${params}`;
                }
                /**
         * TODO V6: Encoding should be enabled in this step
         * So the rest of the app doesn't have to worry about it,
         * It's considered a breaking change because it impacts any API request, including the user's custom code
         */ const serializedParams = qs.stringify(params, {
                    encode: false
                });
                return `${url}?${serializedParams}`;
            }
            return url;
        };
    const addBaseUrl = (url)=>{
        return `${backendURL}${url}`;
    };
    /**
   * We use the factory method because the options
   * are unique to the individual request
   */ const makeCreateRequestUrl = (options)=>pipe(normalizeUrl, addBaseUrl, paramsSerializer(options?.params));
    const fetchClient = {
        get: async (url, options)=>{
            const headers = new Headers({
                ...defaultHeader,
                ...options?.headers
            });
            /**
       * this applies all our transformations to the URL
       * - normalizing (making sure it has the correct slash)
       * - appending our BaseURL which comes from the window.strapi object
       * - serializing our params with QS
       */ const createRequestUrl = makeCreateRequestUrl(options);
            const response = await fetch(createRequestUrl(url), {
                signal: options?.signal ?? defaultOptions.signal,
                method: 'GET',
                headers
            });
            return responseInterceptor(response, options?.validateStatus);
        },
        post: async (url, data, options)=>{
            const headers = new Headers({
                ...defaultHeader,
                ...options?.headers
            });
            const createRequestUrl = makeCreateRequestUrl(options);
            /**
       * we have to remove the Content-Type value if it was a formData request
       * the browser will automatically set the header value
       */ if (isFormDataRequest(data)) {
                headers.delete('Content-Type');
            }
            const response = await fetch(createRequestUrl(url), {
                signal: options?.signal ?? defaultOptions.signal,
                method: 'POST',
                headers,
                body: isFormDataRequest(data) ? data : JSON.stringify(data)
            });
            return responseInterceptor(response, options?.validateStatus);
        },
        put: async (url, data, options)=>{
            const headers = new Headers({
                ...defaultHeader,
                ...options?.headers
            });
            const createRequestUrl = makeCreateRequestUrl(options);
            /**
       * we have to remove the Content-Type value if it was a formData request
       * the browser will automatically set the header value
       */ if (isFormDataRequest(data)) {
                headers.delete('Content-Type');
            }
            const response = await fetch(createRequestUrl(url), {
                signal: options?.signal ?? defaultOptions.signal,
                method: 'PUT',
                headers,
                body: isFormDataRequest(data) ? data : JSON.stringify(data)
            });
            return responseInterceptor(response, options?.validateStatus);
        },
        del: async (url, options)=>{
            const headers = new Headers({
                ...defaultHeader,
                ...options?.headers
            });
            const createRequestUrl = makeCreateRequestUrl(options);
            const response = await fetch(createRequestUrl(url), {
                signal: options?.signal ?? defaultOptions.signal,
                method: 'DELETE',
                headers
            });
            return responseInterceptor(response, options?.validateStatus);
        }
    };
    return fetchClient;
};

exports.FetchError = FetchError;
exports.getFetchClient = getFetchClient;
exports.isFetchError = isFetchError;
//# sourceMappingURL=getFetchClient.js.map
