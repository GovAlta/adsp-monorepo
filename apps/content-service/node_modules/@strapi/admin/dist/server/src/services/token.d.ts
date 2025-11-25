import type { Algorithm } from 'jsonwebtoken';
import type { AdminUser } from '../../../shared/contracts/shared';
export type TokenOptions = {
    expiresIn?: string;
    algorithm?: Algorithm;
    privateKey?: string;
    publicKey?: string;
    [key: string]: unknown;
};
export type TokenPayload = {
    id: AdminUser['id'];
};
export type AdminAuthConfig = {
    secret: string;
    options: TokenOptions;
};
declare const getTokenOptions: () => {
    secret: string;
    options: {
        expiresIn: string;
    } & TokenOptions;
};
/**
 * Create a random token
 */
declare const createToken: () => string;
declare const checkSecretIsDefined: () => void;
export { createToken, getTokenOptions, checkSecretIsDefined };
/**
 * Convert an expiresIn value (string or number) into seconds.
 * Supported formats:
 * - number: treated as seconds
 * - numeric string (e.g. "180"): treated as seconds
 * - shorthand string: "Xs", "Xm", "Xh", "Xd", "Xw" (case-insensitive)
 * Returns undefined when value is not set or invalid.
 */
export declare const expiresInToSeconds: (expiresIn: unknown) => number | undefined;
//# sourceMappingURL=token.d.ts.map