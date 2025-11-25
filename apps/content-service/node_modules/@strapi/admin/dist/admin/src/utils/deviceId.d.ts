/**
 * Returns a stable device identifier for session-based authentication flows.
 * Uses localStorage to persist a UUID between sessions on the same browser.
 */
export declare const getOrCreateDeviceId: () => string;
