import type { Data, Modules } from '@strapi/types';
import type { errors } from '@strapi/utils';
import { AdminRole, Permission, SanitizedAdminRole } from './shared';
export type SanitizedPermission = Pick<Permission, 'id' | 'action' | 'actionParameters' | 'subject' | 'properties' | 'conditions'>;
type SanitizedAdminRoleWithUsersCount = SanitizedAdminRole & {
    usersCount?: number;
};
/**
 * GET /roles/:id/permissions - Get the permissions of a role
 */
export declare namespace GetPermissions {
    interface Request {
        params: {
            id: string;
        };
        query: {};
        body: {};
    }
    interface Response {
        data: Permission[];
        error?: errors.ApplicationError | errors.NotFoundError;
    }
}
/**
 * PUT /roles/:id/permissions - Update the permissions of a role
 */
export declare namespace UpdatePermissions {
    interface Request {
        params: {
            id: Data.ID;
        };
        query: {};
        body: {
            permissions: Omit<Permission, 'id' | 'createdAt' | 'updatedAt' | 'actionParameters'>[];
        };
    }
    interface Response {
        data: SanitizedPermission[];
        error?: errors.ApplicationError | errors.NotFoundError | errors.YupValidationError;
    }
}
/**
 * GET /roles/:id - Find a role by ID
 */
export declare namespace FindRole {
    interface Request {
        params: {
            id: string;
        };
        query: {};
        body: {};
    }
    interface Response {
        data: SanitizedAdminRoleWithUsersCount;
        error?: errors.ApplicationError | errors.NotFoundError;
    }
}
/**
 * GET /roles
 */
export declare namespace FindRoles {
    interface Request {
        query: Modules.EntityService.Params.Pick<'admin::role', 'sort' | 'filters' | 'fields'>;
        body: {};
    }
    interface Response {
        data: SanitizedAdminRoleWithUsersCount[];
        error?: errors.ApplicationError | errors.ValidationError;
    }
}
/**
 * POST /roles - Create a role
 */
export declare namespace Create {
    interface Request {
        query: {};
        body: {
            name: string;
            description?: string;
        };
    }
    interface Response {
        data: SanitizedAdminRole;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * PUT /roles/:id - Update a role
 */
export declare namespace Update {
    interface Request {
        params: {
            id: string;
        };
        query: {};
        body: {
            name?: string;
            description?: string;
        };
    }
    interface Response {
        data: SanitizedAdminRole;
        error?: errors.ApplicationError | errors.NotFoundError;
    }
}
/**
 * DELETE /roles/:id - Delete a role
 */
export declare namespace Delete {
    interface Request {
        params: {
            id: string;
        };
        query: {};
        body: {};
    }
    interface Response {
        data: Omit<AdminRole, 'users' | 'permissions'> | null;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /roles/batch-delete - Delete multiple roles
 */
export declare namespace BatchDelete {
    interface Request {
        query: {};
        body: {
            ids: string[];
        };
    }
    interface Response {
        data: (Omit<AdminRole, 'users' | 'permissions'> | null)[];
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
export {};
