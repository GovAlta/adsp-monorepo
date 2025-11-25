declare const prefixFileUrlWithBackendUrl: (fileURL?: string) => string | undefined;
/**
 * @description Creates an absolute URL, if there is no URL or it
 * is relative, we use the `window.location.origin` as a fallback.
 * IF it's an absolute URL, we return it as is.
 */
declare const createAbsoluteUrl: (url?: string) => string;
export { createAbsoluteUrl, prefixFileUrlWithBackendUrl };
