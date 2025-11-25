import '@strapi/types';
import { SanitizedTransferToken, TokenCreatePayload, TokenUpdatePayload, TransferToken } from '../../../../shared/contracts/transfer';
/**
 * Return a list of all tokens and their permissions
 */
declare const list: () => Promise<SanitizedTransferToken[]>;
export declare const hasAccessKey: <T extends {
    accessKey?: string | undefined;
}>(attributes: T) => attributes is T & {
    accessKey: string;
};
/**
 * Create a token and its permissions
 */
declare const create: (attributes: TokenCreatePayload) => Promise<TransferToken>;
/**
 * Update a token and its permissions
 */
declare const update: (id: string | number, attributes: TokenUpdatePayload) => Promise<SanitizedTransferToken>;
/**
 * Revoke (delete) a token
 */
declare const revoke: (id: string | number) => Promise<SanitizedTransferToken>;
/**
 *  Get a token
 */
declare const getBy: (whereParams?: {
    id?: string | number | undefined;
    name?: string | undefined;
    lastUsedAt?: number | undefined;
    description?: string | undefined;
    accessKey?: string | undefined;
}) => Promise<SanitizedTransferToken | null>;
/**
 * Retrieve a token by id
 */
declare const getById: (id: string | number) => Promise<SanitizedTransferToken | null>;
/**
 * Retrieve a token by name
 */
declare const getByName: (name: string) => Promise<SanitizedTransferToken | null>;
/**
 * Check if token exists
 */
declare const exists: (whereParams?: {
    id?: string | number | undefined;
    name?: string | undefined;
    lastUsedAt?: number | undefined;
    description?: string | undefined;
    accessKey?: string | undefined;
}) => Promise<boolean>;
declare const regenerate: (id: string | number) => Promise<TransferToken>;
/**
 * Return a secure sha512 hash of an accessKey
 */
declare const hash: (accessKey: string) => string;
declare const checkSaltIsDefined: () => void;
export { create, list, exists, getBy, getById, getByName, update, revoke, regenerate, hash, checkSaltIsDefined, };
//# sourceMappingURL=token.d.ts.map