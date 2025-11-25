import { errors } from '@strapi/utils';
import type { Data } from '@strapi/types';
export type ApiToken = {
    accessKey: string;
    encryptedKey: string;
    createdAt: string;
    description: string;
    expiresAt: string;
    id: Data.ID;
    lastUsedAt: string | null;
    lifespan: string | number | null;
    name: string;
    permissions: string[];
    type: 'custom' | 'full-access' | 'read-only';
    updatedAt: string;
};
export interface ApiTokenBody extends Pick<ApiToken, 'description' | 'name'> {
    lifespan?: ApiToken['lifespan'] | null;
    permissions?: ApiToken['permissions'] | null;
    type: ApiToken['type'] | undefined;
}
/**
 * POST /api-tokens - Create an api token
 */
export declare namespace Create {
    interface Request {
        body: ApiTokenBody;
        query: {};
    }
    interface Response {
        data: ApiToken;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * GET /api-tokens - List api tokens
 */
export declare namespace List {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: ApiToken[];
        error?: errors.ApplicationError;
    }
}
/**
 * DELETE /api-tokens/:id - Delete an API token
 */
export declare namespace Revoke {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Data.ID;
    }
    interface Response {
        data: ApiToken;
        error?: errors.ApplicationError;
    }
}
/**
 * GET /api-tokens/:id - Get an API token
 */
export declare namespace Get {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Data.ID;
    }
    interface Response {
        data: ApiToken;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /api-tokens/:id - Update an API token
 */
export declare namespace Update {
    interface Request {
        body: ApiTokenBody;
        query: {};
    }
    interface Params {
        id: Data.ID;
    }
    interface Response {
        data: ApiToken;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
