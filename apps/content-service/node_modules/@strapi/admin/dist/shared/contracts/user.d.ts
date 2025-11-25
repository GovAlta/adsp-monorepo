import { errors } from '@strapi/utils';
import type { AdminUserCreationPayload, AdminUserUpdatePayload, Pagination, SanitizedAdminUser } from './shared';
import type { Data, Modules } from '@strapi/types';
/**
 * /create - Create an admin user
 */
export declare namespace Create {
    interface Request {
        body: AdminUserCreationPayload;
        query: {};
    }
    interface Response {
        data: SanitizedAdminUser;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * /create - Create an admin user
 */
export declare namespace Create {
    interface Request {
        body: AdminUserCreationPayload;
        query: {};
    }
    interface Response {
        data: SanitizedAdminUser;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * /find - Find admin users
 */
export declare namespace FindAll {
    interface Request {
        body: {};
        query: Modules.EntityService.Params.Pick<'admin::user', 'filters' | '_q'> & {
            [key: string]: any;
        };
    }
    interface Response {
        data: {
            results: SanitizedAdminUser[];
            pagination: Pagination;
        };
        error?: errors.ApplicationError;
    }
}
/**
 * /findOne - Find an admin user
 */
export declare namespace FindOne {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Data.ID;
    }
    interface Response {
        data: SanitizedAdminUser;
        error?: errors.ApplicationError;
    }
}
/**
 * /update - Update an admin user
 */
export declare namespace Update {
    interface Request {
        body: AdminUserUpdatePayload;
        query: {};
    }
    interface Params {
        id: Data.ID;
    }
    interface Response {
        data: SanitizedAdminUser;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * /deleteOne - Delete an admin user
 */
export declare namespace DeleteOne {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Data.ID;
    }
    interface Response {
        data: SanitizedAdminUser;
        error?: errors.ApplicationError;
    }
}
/**
 * /users/batch-delete - Delete admin users
 */
export declare namespace DeleteMany {
    interface Request {
        body: {
            ids: Data.ID[];
        };
        query: {};
    }
    interface Response {
        data: SanitizedAdminUser[];
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
