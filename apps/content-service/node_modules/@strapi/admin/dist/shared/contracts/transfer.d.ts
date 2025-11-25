import { errors } from '@strapi/utils';
export interface TransferTokenPermission {
    id: number | `${number}`;
    action: 'push' | 'pull' | 'push-pull';
    token: TransferToken | number;
}
export interface DatabaseTransferToken {
    id: number | string;
    name: string;
    description: string;
    accessKey: string;
    lastUsedAt?: number;
    lifespan: string | number | null;
    expiresAt: number;
    permissions: TransferTokenPermission[];
}
export interface TransferToken extends Omit<DatabaseTransferToken, 'permissions'> {
    permissions: Array<TransferTokenPermission['action']>;
}
export type SanitizedTransferToken = Omit<TransferToken, 'accessKey'>;
export type TokenCreatePayload = Pick<TransferToken, 'name' | 'description' | 'lastUsedAt' | 'permissions' | 'lifespan'> & {
    accessKey?: string;
};
/**
 * GET /transfer/runner/push
 */
export declare namespace RunnerPush {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: {};
        error?: errors.ApplicationError | errors.UnauthorizedError;
    }
}
/**
 * GET /transfer/runner/pull
 */
export declare namespace RunnerPull {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: {};
        error?: errors.ApplicationError | errors.UnauthorizedError;
    }
}
/**
 * GET /transfer/tokens - List all transfer tokens
 */
export declare namespace TokenList {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: SanitizedTransferToken[];
        error?: errors.ApplicationError;
    }
}
/**
 * GET /transfer/tokens/:id - Get a token by ID
 */
export declare namespace TokenGetById {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: string | number;
    }
    interface Response {
        data: SanitizedTransferToken;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /transfer/tokens - Create a transfer token
 */
export declare namespace TokenCreate {
    interface Request {
        body: TokenCreatePayload;
        query: {};
    }
    interface Response {
        data: TransferToken;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
export interface TokenUpdatePayload extends Pick<TokenCreatePayload, 'name' | 'description'>, Partial<Omit<TokenCreatePayload, 'name' | 'description'>> {
}
/**
 * PUT /transfer/tokens/:id - Update a token by ID
 */
export declare namespace TokenUpdate {
    interface Request {
        body: TokenUpdatePayload;
        query: {};
    }
    interface Params {
        id: string | number;
    }
    interface Response {
        data: SanitizedTransferToken;
        error?: errors.ApplicationError;
    }
}
/**
 * DELETE /transfer/tokens/:id - Delete a transfer token
 */
export declare namespace TokenRevoke {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: string | number;
    }
    interface Response {
        data: SanitizedTransferToken;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /transfer/tokens/:id/regenerate - Regenerate a token by ID
 */
export declare namespace TokenRegenerate {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: string | number;
    }
    interface Response {
        data: TransferToken;
        error?: errors.ApplicationError;
    }
}
