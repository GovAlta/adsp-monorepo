/**
 * Retrieves the value of a specified cookie.
 *
 * @param name - The name of the cookie to retrieve.
 * @returns The decoded cookie value if found, otherwise null.
 */
export declare const getCookieValue: (name: string) => string | null;
/**
 * Sets a cookie with the given name, value, and optional expiration time.
 *
 * @param name - The name of the cookie.
 * @param value - The value of the cookie.
 * @param days - (Optional) Number of days until the cookie expires. If omitted, the cookie is a session cookie.
 */
export declare const setCookie: (name: string, value: string, days?: number) => void;
/**
 * Deletes a cookie by setting its expiration date to a past date.
 *
 * @param name - The name of the cookie to delete.
 */
export declare const deleteCookie: (name: string) => void;
