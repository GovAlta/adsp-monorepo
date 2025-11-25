import type { Data } from '@strapi/types';
import type { AdminUser, AdminUserCreationPayload, SanitizedAdminUser, AdminUserUpdatePayload } from '../../../shared/contracts/shared';
declare const _default: {
    create: (attributes: Partial<AdminUserCreationPayload> & {
        isActive?: true | undefined;
    }) => Promise<AdminUser>;
    updateById: (id: Data.ID, attributes: Partial<AdminUserUpdatePayload>) => Promise<AdminUser>;
    exists: (attributes?: unknown) => Promise<boolean>;
    findRegistrationInfo: (registrationToken: string) => Promise<Pick<AdminUser, "firstname" | "lastname" | "email"> | undefined>;
    register: ({ registrationToken, userInfo, }: {
        registrationToken: string;
        userInfo: Partial<AdminUser>;
    }) => Promise<AdminUser>;
    sanitizeUser: (user: AdminUser) => SanitizedAdminUser;
    findOne: (id: Data.ID, populate?: string[]) => Promise<any>;
    findOneByEmail: (email: string, populate?: never[]) => Promise<any>;
    findPage: (params?: {}) => Promise<unknown>;
    deleteById: (id: Data.ID) => Promise<AdminUser | null>;
    deleteByIds: (ids: (string | number)[]) => Promise<AdminUser[]>;
    countUsersWithoutRole: () => Promise<number>;
    count: (where?: {}) => Promise<number>;
    assignARoleToAll: (roleId: Data.ID) => Promise<void>;
    displayWarningIfUsersDontHaveRole: () => Promise<void>;
    resetPasswordByEmail: (email: string, password: string) => Promise<void>;
    getLanguagesInUse: () => Promise<string[]>;
    isFirstSuperAdminUser: (userId: Data.ID) => Promise<boolean>;
    getAiToken: () => Promise<{
        token: string;
        expiresAt?: string | undefined;
    }>;
};
export default _default;
//# sourceMappingURL=user.d.ts.map