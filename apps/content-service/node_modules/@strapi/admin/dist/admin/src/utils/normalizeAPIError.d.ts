import type { FetchError } from '../utils/getFetchClient';
export interface NormalizeErrorOptions {
    name?: string;
    intlMessagePrefixCallback?: (id: string) => string;
}
interface NormalizeErrorReturn {
    id: string;
    defaultMessage: string;
    name?: string;
    values: Record<'path', string> | Record<string, never>;
}
/**
 * Normalize the format of `ResponseError`
 * in places where the hook `useAPIErrorHandler` can not called
 * (e.g. outside of a React component).
 */
export declare function normalizeAPIError(apiError: FetchError, intlMessagePrefixCallback?: NormalizeErrorOptions['intlMessagePrefixCallback']): NormalizeErrorReturn | {
    name: string;
    message: string | null;
    errors: NormalizeErrorReturn[];
} | null;
export {};
