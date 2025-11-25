/**
 * Centralized AI client utilities:
 * - Token retrieval via admin endpoint using getFetchClient
 * - In-memory + sessionStorage caching with near-expiry buffer
 * - Safe JSON parsing for error handling
 * - Single-retry policy on token invalidation
 */
export interface AITokenData {
    token: string;
    expiresAt: string;
}
export declare const clearAIJwt: () => void;
export declare const getAIJwt: () => Promise<AITokenData | null>;
export declare const prefetchAIToken: () => Promise<void>;
export declare const safeParseJson: (response: Response) => Promise<any>;
export interface StrapiContextHeaders {
    strapiVersion?: string | null;
    projectId?: string | null;
    userId?: string | null;
}
export interface FetchAIOptions extends RequestInit {
    ctx?: StrapiContextHeaders;
}
/**
 * Generic fetch wrapper for AI endpoints with token injection and single retry on invalidation
 */
export declare const fetchAI: (input: RequestInfo | URL, options?: FetchAIOptions) => Promise<Response>;
/**
 * Factory to provide a fetch implementation compatible with AI SDK useChat
 * that injects AI JWT + Strapi context headers and retries on token invalidation once.
 */
export declare const makeChatFetch: (ctx: StrapiContextHeaders) => (input: RequestInfo | URL, options?: RequestInit) => Promise<Response>;
