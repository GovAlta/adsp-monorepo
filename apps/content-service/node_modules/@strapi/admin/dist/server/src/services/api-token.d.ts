/// <reference types="node" />
import type { Update, ApiToken, ApiTokenBody } from '../../../shared/contracts/api-token';
type WhereParams = {
    id?: string | number;
    name?: string;
    lastUsedAt?: number;
    description?: string;
    accessKey?: string;
};
/**
 *  Get a token
 */
declare const getBy: (whereParams?: WhereParams) => Promise<ApiToken | null>;
/**
 * Check if token exists
 */
declare const exists: (whereParams?: WhereParams) => Promise<boolean>;
/**
 * Return a secure sha512 hash of an accessKey
 */
declare const hash: (accessKey: string) => string;
/**
 * Create a token and its permissions
 */
declare const create: (attributes: ApiTokenBody) => Promise<ApiToken>;
declare const regenerate: (id: string | number) => Promise<ApiToken>;
declare const checkSaltIsDefined: () => void;
/**
 * Return a list of all tokens and their permissions
 */
declare const list: () => Promise<Array<ApiToken>>;
/**
 * Revoke (delete) a token
 */
declare const revoke: (id: string | number) => Promise<ApiToken>;
/**
 * Retrieve a token by id
 */
declare const getById: (id: string | number) => Promise<ApiToken | null>;
/**
 * Retrieve a token by name
 */
declare const getByName: (name: string) => Promise<ApiToken | null>;
/**
 * Update a token and its permissions
 */
declare const update: (id: string | number, attributes: Update.Request['body']) => Promise<ApiToken>;
declare const count: (where?: {}) => Promise<number>;
export { create, count, regenerate, exists, checkSaltIsDefined, hash, list, revoke, getById, update, getByName, getBy, };
//# sourceMappingURL=api-token.d.ts.map