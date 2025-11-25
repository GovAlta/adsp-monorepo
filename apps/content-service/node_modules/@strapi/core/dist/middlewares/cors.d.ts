import type { Core } from '@strapi/types';
export type Config = {
    enabled?: boolean;
    origin: string | string[] | ((ctx: any) => string | string[] | Promise<string | string[]>);
    expose?: string | string[];
    maxAge?: number;
    credentials?: boolean;
    methods?: string | string[];
    headers?: string | string[];
    keepHeadersOnError?: boolean;
};
/**
 * Determines if a request origin is allowed based on the configured origin list
 * @param requestOrigin - The origin from the request header
 * @param configuredOrigin - The origin configuration (string, array, or function)
 * @param ctx - The Koa context (for function-based origin)
 * @returns The allowed origin string or empty string if blocked
 */
export declare const matchOrigin: (requestOrigin: string | undefined, configuredOrigin: string | string[] | ((ctx: any) => string | string[] | Promise<string | string[]>), ctx?: any) => Promise<string>;
export declare const cors: Core.MiddlewareFactory<Config>;
//# sourceMappingURL=cors.d.ts.map