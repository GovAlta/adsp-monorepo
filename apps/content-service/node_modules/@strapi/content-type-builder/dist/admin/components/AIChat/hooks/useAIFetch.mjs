import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useAppInfo } from '@strapi/admin/strapi-admin';
import { useGetAIUsageQuery } from '@strapi/admin/strapi-admin/ee';
import { DefaultChatTransport } from 'ai';
import { makeChatFetch, fetchAI, safeParseJson } from '../lib/aiClient.mjs';
import { STRAPI_AI_CHAT_URL, STRAPI_AI_URL } from '../lib/constants.mjs';

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
        const strapiVersion = useAppInfo('useAIFetch', (state)=>state.strapiVersion);
        const projectId = useAppInfo('useAIFetch', (state)=>state.projectId);
        const userId = useAppInfo('useAIFetch-user', (state)=>state.userId);
        const aiUsage = useGetAIUsageQuery(undefined, {
            refetchOnMountOrArgChange: true
        });
        const [isPending, setIsPending] = useState(false);
        const [error, setError] = useState(null);
        /**
     * Make a type-safe API call to the specified Strapi AI endpoint with retry logic
     */ const fetchData = async (options = {})=>{
            setIsPending(true);
            setError(null);
            try {
                const fullUrl = `${STRAPI_AI_URL}${endpoint}`;
                const isJson = !!options.body && !options.formData;
                const response = await fetchAI(fullUrl, {
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
                const body = await safeParseJson(response);
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
    const strapiVersion = useAppInfo('useAIChat', (state)=>state.strapiVersion);
    const projectId = useAppInfo('useAIFetch', (state)=>state.projectId);
    const userId = useAppInfo('useAIChat-user', (state)=>state.userId);
    const customFetch = makeChatFetch({
        strapiVersion,
        projectId,
        userId
    });
    return useChat({
        ...props,
        transport: new DefaultChatTransport({
            api: STRAPI_AI_CHAT_URL,
            fetch: customFetch
        })
    });
};

export { CHAT_TOO_LONG_ERROR, LICENSE_LIMIT_EXCEEDED_ERROR, LICENSE_LIMIT_REACHED_ERROR, TOO_MANY_REQUESTS_ERROR, createAIFetchHook, useAIChat, useFetchGenerateTitle, useFetchSendFeedback, useFetchUploadMedia, useFetchUploadProject };
//# sourceMappingURL=useAIFetch.mjs.map
