import type { AdminUser, AdminUserCreationPayload } from '../../../shared/contracts/shared';
/**
 * Create a new user model by merging default and specified attributes
 * @param attributes A partial user object
 */
export declare function createUser(attributes: Partial<AdminUserCreationPayload>): {
    firstname?: string | undefined;
    lastname?: string | undefined;
    username: string | null;
    email?: string | undefined;
    password?: string | undefined;
    resetPasswordToken?: string | null | undefined;
    registrationToken?: string | null | undefined;
    preferedLanguage?: string | undefined;
    roles: import("@strapi/types/dist/data").ID[];
    isActive: boolean;
};
export declare const hasSuperAdminRole: (user: AdminUser) => boolean;
export declare const ADMIN_USER_ALLOWED_FIELDS: string[];
declare const _default: {
    createUser: typeof createUser;
    hasSuperAdminRole: (user: AdminUser) => boolean;
    ADMIN_USER_ALLOWED_FIELDS: string[];
};
export default _default;
//# sourceMappingURL=user.d.ts.map