import type { errors } from '@strapi/utils';
import type { SanitizedAdminUser, Permission } from './shared';
/**
 * GET /users/me - Log in as an admin user
 */
export declare namespace GetMe {
    interface Request {
        query: {};
        body: {};
    }
    interface Response {
        data: SanitizedAdminUser;
        error?: errors.ApplicationError;
    }
}
/**
 * PUT /users/me - Update the current admin user
 */
export declare namespace UpdateMe {
    interface BaseRequestBody {
        password?: string;
        currentPassword?: string;
        email?: string;
        firstname?: string;
        lastname?: string;
        username?: string;
        preferedLanguage?: string;
    }
    interface Request {
        query: {};
        body: BaseRequestBody;
    }
    interface Response {
        data: SanitizedAdminUser;
        error?: errors.ApplicationError | errors.ValidationError<'ValidationError', {
            currentPassword: ['Invalid credentials'];
        }> | errors.YupValidationError;
    }
}
/**
 * GET /getAiToken - Get an AI token for the current admin user
 */
export declare namespace GetAiToken {
    interface Request {
        query: {};
        body: {};
    }
    interface Response {
        data: {
            token: string;
            expiresAt?: string;
        };
        error?: errors.ApplicationError;
    }
}
/**
 * GET /users/me/permissions - Get the permissions of the current admin user
 */
export declare namespace GetOwnPermissions {
    interface Request {
        query: {};
        body: {};
    }
    interface Response {
        data: Permission[];
        error?: errors.ApplicationError;
    }
}
/**
 * GET /users/me/ai-token - Get AI token for the current admin user
 */
export declare namespace GetAiToken {
    interface Request {
        query: {};
        body: {};
    }
    interface Response {
        data: {
            token: string;
            expiresAt?: string;
        };
        error?: errors.ApplicationError;
    }
}
