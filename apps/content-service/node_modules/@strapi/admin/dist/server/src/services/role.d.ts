import { hooks as hooksUtils } from '@strapi/utils';
import type { Data } from '@strapi/types';
import type { AdminUser, AdminRole, Permission } from '../../../shared/contracts/shared';
export type AdminRoleWithUsersCount = AdminRole & {
    usersCount: number;
};
declare const _default: {
    hooks: {
        willResetSuperAdminPermissions: {
            call(param: unknown): Promise<unknown>;
            getHandlers(): hooksUtils.Handler[];
            register(handler: hooksUtils.Handler): hooksUtils.Hook<hooksUtils.Handler>;
            delete(handler: hooksUtils.Handler): hooksUtils.Hook<hooksUtils.Handler>;
        };
    };
    sanitizeRole: <T extends object>(obj: T) => Omit<T, "users" | "permissions">;
    create: (attributes: Partial<AdminRole>) => Promise<AdminRole>;
    findOne: (params?: {}, populate?: unknown) => Promise<AdminRole>;
    findOneWithUsersCount: (params?: {}, populate?: unknown) => Promise<AdminRoleWithUsersCount>;
    find: (params: {} | undefined, populate: unknown) => Promise<AdminRole[]>;
    findAllWithUsersCount: (params: any) => Promise<AdminRoleWithUsersCount[]>;
    update: (params: any, attributes: Partial<AdminRole>) => Promise<AdminRole>;
    exists: (params?: unknown) => Promise<boolean>;
    count: (params?: any) => Promise<number>;
    deleteByIds: (ids?: Data.ID[]) => Promise<AdminRole[]>;
    getUsersCount: (roleId: Data.ID) => Promise<number>;
    getSuperAdmin: () => Promise<AdminRole | undefined>;
    getSuperAdminWithUsersCount: () => Promise<AdminRoleWithUsersCount>;
    createRolesIfNoneExist: () => Promise<void>;
    displayWarningIfNoSuperAdmin: () => Promise<void>;
    addPermissions: (roleId: Data.ID, permissions: any) => Promise<Permission[]>;
    hasSuperAdminRole: (user: AdminUser) => boolean;
    assignPermissions: (roleId: Data.ID, permissions?: Pick<Permission, "conditions" | "action" | "subject">[]) => Promise<Permission[]>;
    resetSuperAdminPermissions: () => Promise<void>;
    checkRolesIdForDeletion: (ids?: Data.ID[]) => Promise<void>;
    constants: {
        superAdminCode: string;
    };
};
export default _default;
//# sourceMappingURL=role.d.ts.map