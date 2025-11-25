'use strict';

var React = require('react');
var react = require('@ai-sdk/react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var ee = require('@strapi/admin/strapi-admin/ee');
var ai = require('ai');
var aiClient = require('../lib/aiClient.js');
var constants = require('../lib/constants.js');

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/ const TOO_MANY_REQUESTS_ERROR = 'Too many requests';
const LICENSE_LIMIT_REACHED_ERROR = 'License limit';
const LICENSE_LIMIT_EXCEEDED_ERROR = 'AI credit limit exceeded';
const CHAT_TOO_LONG_ERROR = 'Chat too long';
/**
 * Base hook factory for making type-safe API calls to Strapi AI endpoints.
 * Creates a hook specific to a single endpoint.
 */ const createAIFetchHook = (endpoint)=>{
    return ()=>{
        const strapiVersion = strapiAdmin.useAppInfo('useAIFetch', (state)=>state.strapiVersion);
        const projectId = strapiAdmin.useAppInfo('useAIFetch', (state)=>state.projectId);
        const userId = strapiAdmin.useAppInfo('useAIFetch-user', (state)=>state.userId);
        const aiUsage = ee.useGetAIUsageQuery(undefined, {
            refetchOnMountOrArgChange: true
        });
        const [isPending, setIsPending] = React.useState(false);
        const [error, setError] = React.useState(null);
        /**
     * Make a type-safe API call to the specified Strapi AI endpoint with retry logic
     */ const fetchData = async (options = {})=>{
            setIsPending(true);
            setError(null);
            try {
                const fullUrl = `${constants.STRAPI_AI_URL}${endpoint}`;
                const isJson = !!options.body && !options.formData;
                const response = await aiClient.fetchAI(fullUrl, {
                    method: 'POST',
                    headers: isJson ? {
                        'Content-Type': 'application/json',
                        ...options.headers || {}
                    } : options.headers,
                    body: options.formData ? options.formData : isJson ? JSON.stringify(options.body || {}) : undefined,
                    ctx: {
                        strapiVersion,
                        projectId,
                        userId
                    }
                });
                // refetch ai usage data on every successful request
                aiUsage.refetch();
                const body = await aiClient.safeParseJson(response);
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                return body;
            } catch (err) {
                setError(err instanceof Error ? err.message : `Failed to fetch data from ${endpoint}`);
                return null;
            } finally{
                setIsPending(false);
            }
        };
        return {
            isPending,
            error,
            fetch: fetchData
        };
    };
};
// Create specific hooks for each endpoint
const useFetchGenerateTitle = createAIFetchHook('/schemas/chat/generate-title');
const useFetchUploadProject = createAIFetchHook('/schemas/chat/attachment');
const useFetchSendFeedback = createAIFetchHook('/schemas/chat/feedback');
const useFetchUploadMedia = createAIFetchHook('/media/upload');
/**
 * Hook wrapper for AI SDK's useChat with Strapi-specific configuration
 */ const useAIChat = (props)=>{
    const strapiVersion = strapiAdmin.useAppInfo('useAIChat', (state)=>state.strapiVersion);
    const projectId = strapiAdmin.useAppInfo('useAIFetch', (state)=>state.projectId);
    const userId = strapiAdmin.useAppInfo('useAIChat-user', (state)=>state.userId);
    const customFetch = aiClient.makeChatFetch({
        strapiVersion,
        projectId,
        userId
    });
    return react.useChat({
        ...props,
        transport: new ai.DefaultChatTransport({
            api: constants.STRAPI_AI_CHAT_URL,
            fetch: customFetch
        })
    });
};

exports.CHAT_TOO_LONG_ERROR = CHAT_TOO_LONG_ERROR;
exports.LICENSE_LIMIT_EXCEEDED_ERROR = LICENSE_LIMIT_EXCEEDED_ERROR;
exports.LICENSE_LIMIT_REACHED_ERROR = LICENSE_LIMIT_REACHED_ERROR;
exports.TOO_MANY_REQUESTS_ERROR = TOO_MANY_REQUESTS_ERROR;
exports.createAIFetchHook = createAIFetchHook;
exports.useAIChat = useAIChat;
exports.useFetchGenerateTitle = useFetchGenerateTitle;
exports.useFetchSendFeedback = useFetchSendFeedback;
exports.useFetchUploadMedia = useFetchUploadMedia;
exports.useFetchUploadProject = useFetchUploadProject;
//# sourceMappingURL=useAIFetch.js.map
