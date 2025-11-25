import { getFetchClient } from '@strapi/admin/strapi-admin';

let aiTokenCache = null;
const SESSION_STORAGE_KEY = 'strapi-ai-token';
const EXPIRY_BUFFER_MS = 60 * 1000;
const parseExpiryMs = (expiresAt)=>{
    const ms = Date.parse(expiresAt);
    return Number.isFinite(ms) ? ms : null;
};
const getTokenState = (expiresAt, bufferMs = EXPIRY_BUFFER_MS, now = Date.now())=>{
    const expMs = parseExpiryMs(expiresAt);
    if (expMs === null) {
        return 'expired';
    }
    if (expMs <= now) {
        return 'expired';
    }
    if (expMs - bufferMs <= now) {
        return 'stale';
    }
    return 'valid';
};
const isTokenUsable = (expiresAt, bufferMs = EXPIRY_BUFFER_MS, now = Date.now())=>getTokenState(expiresAt, bufferMs, now) === 'valid';
const clearAIJwt = ()=>{
    aiTokenCache = null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
};
const readFromSession = ()=>{
    try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed;
    } catch  {
        return null;
    }
};
const writeToSession = (data)=>{
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
};
const getAIJwt = async ()=>{
    // Check memory cache
    if (aiTokenCache && isTokenUsable(aiTokenCache.expiresAt)) {
        return aiTokenCache;
    }
    // Check session storage
    const fromSession = readFromSession();
    if (fromSession && isTokenUsable(fromSession.expiresAt)) {
        aiTokenCache = fromSession;
        return aiTokenCache;
    }
    // Fetch from admin endpoint
    try {
        const { get } = getFetchClient();
        const { data } = await get('/admin/ai-token');
        const token = data?.token || data?.data?.token;
        const expiresAt = data?.expiresAt || data?.data?.expiresAt;
        if (token && expiresAt) {
            aiTokenCache = {
                token,
                expiresAt
            };
            writeToSession(aiTokenCache);
            return aiTokenCache;
        }
        return null;
    } catch  {
        return null;
    }
};
const prefetchAIToken = async ()=>{
    try {
        // If we already have a valid token (not expiring soon), do nothing
        const existing = await getAIJwt();
        if (existing) {
            return;
        }
        // Attempt a fetch to populate cache
        await getAIJwt();
    } catch  {
    // no-op
    }
};
const safeParseJson = async (response)=>{
    try {
        return await response.json();
    } catch  {
        try {
            const text = await response.text();
            return {
                error: text
            };
        } catch  {
            return undefined;
        }
    }
};
const buildHeaders = (token, ctx, extra)=>{
    return {
        Authorization: `Bearer ${token}`,
        'X-Strapi-Version': ctx?.strapiVersion || 'latest',
        'X-Strapi-User': ctx?.userId || 'unknown',
        'X-Strapi-Project-Id': ctx?.projectId || 'unknown',
        ...extra
    };
};
const shouldRetryForToken = (status, body)=>{
    if (status === 401 || status === 403) {
        return true;
    }
    const msg = (body?.error || '').toString().toLowerCase();
    return msg.includes('expired') || msg.includes('invalid token');
};
/**
 * Generic fetch wrapper for AI endpoints with token injection and single retry on invalidation
 */ const fetchAI = async (input, options = {})=>{
    // Get token
    const tokenData = await getAIJwt();
    if (!tokenData?.token) {
        const error = new Error('Could not authorize with AI Server. Please contact your administrator.');
        throw error;
    }
    const make = async (token)=>{
        const headers = buildHeaders(token, options.ctx, options.headers);
        return fetch(input, {
            ...options,
            headers
        });
    };
    let response = await make(tokenData.token);
    let body = undefined;
    try {
        body = await safeParseJson(response.clone());
    } catch  {
    // no-op
    }
    if (shouldRetryForToken(response.status, body)) {
        clearAIJwt();
        const refreshed = await getAIJwt();
        if (refreshed?.token && refreshed.token !== tokenData.token) {
            response = await make(refreshed.token);
        }
    }
    return response;
};
/**
 * Factory to provide a fetch implementation compatible with AI SDK useChat
 * that injects AI JWT + Strapi context headers and retries on token invalidation once.
 */ const makeChatFetch = (ctx)=>{
    return async (input, options = {})=>{
        return fetchAI(input, {
            ...options,
            ctx
        });
    };
};

export { clearAIJwt, fetchAI, getAIJwt, makeChatFetch, prefetchAIToken, safeParseJson };
//# sourceMappingURL=aiClient.mjs.map
