import type { Internal } from '@strapi/types';
/**
 * Deletes the API folder of a contentType
 */
export declare function clear(uid: Internal.UID.ContentType): Promise<void>;
/**
 * Backups the API folder of a contentType
 * @param {string} uid content type uid
 */
export declare function backup(uid: Internal.UID.ContentType): Promise<void>;
/**
 * Rollbacks the API folder of a contentType
 */
export declare function rollback(uid: Internal.UID.ContentType): Promise<void>;
//# sourceMappingURL=api-handler.d.ts.map