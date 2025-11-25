/// <reference types="koa" />
import * as token from './token';
import * as permission from './permission';
import * as contentType from './content-type';
import * as constants from './constants';
import * as condition from './condition';
import * as action from './action';
import * as apiToken from './api-token';
import * as transfer from './transfer';
import * as projectSettings from './project-settings';
declare const _default: {
    auth: {
        checkCredentials: ({ email, password }: {
            email: string;
            password: string;
        }) => Promise<(import("../../../shared/contracts/shared").AdminUser | null)[] | (boolean | {
            message: string;
        } | null)[]>;
        validatePassword: (password: string, hash: string) => Promise<boolean>;
        hashPassword: (password: string) => Promise<string>;
        forgotPassword: ({ email }?: {
            email: string;
        }) => Promise<any>;
        resetPassword: ({ resetPasswordToken, password }?: {
            resetPasswordToken: string;
            password: string;
        }) => Promise<import("../../../shared/contracts/shared").AdminUser>;
    };
    user: {
        create: (attributes: Partial<import("../../../shared/contracts/shared").AdminUserCreationPayload> & {
            isActive?: true | undefined;
        }) => Promise<import("../../../shared/contracts/shared").AdminUser>;
        updateById: (id: import("@strapi/types/dist/data").ID, attributes: Partial<import("../../../shared/contracts/shared").AdminUserUpdatePayload>) => Promise<import("../../../shared/contracts/shared").AdminUser>;
        exists: (attributes?: unknown) => Promise<boolean>;
        findRegistrationInfo: (registrationToken: string) => Promise<Pick<import("../../../shared/contracts/shared").AdminUser, "firstname" | "lastname" | "email"> | undefined>;
        register: ({ registrationToken, userInfo, }: {
            registrationToken: string;
            userInfo: Partial<import("../../../shared/contracts/shared").AdminUser>;
        }) => Promise<import("../../../shared/contracts/shared").AdminUser>;
        sanitizeUser: (user: import("../../../shared/contracts/shared").AdminUser) => import("../../../shared/contracts/shared").SanitizedAdminUser;
        findOne: (id: import("@strapi/types/dist/data").ID, populate?: string[]) => Promise<any>;
        findOneByEmail: (email: string, populate?: never[]) => Promise<any>;
        findPage: (params?: {}) => Promise<unknown>;
        deleteById: (id: import("@strapi/types/dist/data").ID) => Promise<import("../../../shared/contracts/shared").AdminUser | null>;
        deleteByIds: (ids: (string | number)[]) => Promise<import("../../../shared/contracts/shared").AdminUser[]>;
        countUsersWithoutRole: () => Promise<number>;
        count: (where?: {}) => Promise<number>;
        assignARoleToAll: (roleId: import("@strapi/types/dist/data").ID) => Promise<void>;
        displayWarningIfUsersDontHaveRole: () => Promise<void>;
        resetPasswordByEmail: (email: string, password: string) => Promise<void>;
        getLanguagesInUse: () => Promise<string[]>;
        isFirstSuperAdminUser: (userId: import("@strapi/types/dist/data").ID) => Promise<boolean>;
        getAiToken: () => Promise<{
            token: string;
            expiresAt?: string | undefined;
        }>;
    };
    role: {
        hooks: {
            willResetSuperAdminPermissions: {
                call(param: unknown): Promise<unknown>;
                getHandlers(): import("@strapi/utils/dist/hooks").Handler[];
                register(handler: import("@strapi/utils/dist/hooks").Handler): import("@strapi/utils/dist/hooks").Hook<import("@strapi/utils/dist/hooks").Handler>;
                delete(handler: import("@strapi/utils/dist/hooks").Handler): import("@strapi/utils/dist/hooks").Hook<import("@strapi/utils/dist/hooks").Handler>;
            };
        };
        sanitizeRole: <T extends object>(obj: T) => Omit<T, "users" | "permissions">;
        create: (attributes: Partial<import("../../../shared/contracts/shared").AdminRole>) => Promise<import("../../../shared/contracts/shared").AdminRole>;
        findOne: (params?: {}, populate?: unknown) => Promise<import("../../../shared/contracts/shared").AdminRole>;
        findOneWithUsersCount: (params?: {}, populate?: unknown) => Promise<import("./role").AdminRoleWithUsersCount>;
        find: (params: {} | undefined, populate: unknown) => Promise<import("../../../shared/contracts/shared").AdminRole[]>;
        findAllWithUsersCount: (params: any) => Promise<import("./role").AdminRoleWithUsersCount[]>;
        update: (params: any, attributes: Partial<import("../../../shared/contracts/shared").AdminRole>) => Promise<import("../../../shared/contracts/shared").AdminRole>;
        exists: (params?: unknown) => Promise<boolean>;
        count: (params?: any) => Promise<number>;
        deleteByIds: (ids?: import("@strapi/types/dist/data").ID[]) => Promise<import("../../../shared/contracts/shared").AdminRole[]>;
        getUsersCount: (roleId: import("@strapi/types/dist/data").ID) => Promise<number>;
        getSuperAdmin: () => Promise<import("../../../shared/contracts/shared").AdminRole | undefined>;
        getSuperAdminWithUsersCount: () => Promise<import("./role").AdminRoleWithUsersCount>;
        createRolesIfNoneExist: () => Promise<void>;
        displayWarningIfNoSuperAdmin: () => Promise<void>;
        addPermissions: (roleId: import("@strapi/types/dist/data").ID, permissions: any) => Promise<import("../../../shared/contracts/shared").Permission[]>;
        hasSuperAdminRole: (user: import("../../../shared/contracts/shared").AdminUser) => boolean;
        assignPermissions: (roleId: import("@strapi/types/dist/data").ID, permissions?: Pick<import("../../../shared/contracts/shared").Permission, "conditions" | "action" | "subject">[]) => Promise<import("../../../shared/contracts/shared").Permission[]>;
        resetSuperAdminPermissions: () => Promise<void>;
        checkRolesIdForDeletion: (ids?: import("@strapi/types/dist/data").ID[]) => Promise<void>;
        constants: {
            superAdminCode: string;
        };
    };
    passport: {
        init: () => import("koa").Middleware;
        getPassportStrategies: () => import("passport-local").Strategy[];
        authEventsMapper: {
            onConnectionSuccess: string;
            onConnectionError: string;
        };
    };
    token: typeof token;
    permission: typeof permission;
    metrics: {
        sendDidInviteUser: () => Promise<void>;
        sendDidUpdateRolePermissions: () => Promise<void>;
        sendDidChangeInterfaceLanguage: () => Promise<void>;
        sendUpdateProjectInformation: (strapi: import("@strapi/types/dist/core").Strapi) => Promise<void>;
        startCron: (strapi: import("@strapi/types/dist/core").Strapi) => void;
    };
    'content-type': typeof contentType;
    constants: typeof constants;
    condition: typeof condition;
    action: typeof action;
    'api-token': typeof apiToken;
    transfer: typeof transfer;
    'project-settings': typeof projectSettings;
    encryption: {
        encrypt: (value: string) => string | null;
        decrypt: (encryptedValue: string) => string | null;
    };
    homepage: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        getKeyStatistics: () => Promise<{
            assets: number;
            contentTypes: number;
            components: number;
            locales: any;
            admins: number;
            webhooks: number;
            apiTokens: number;
        }>;
        getHomepageLayout: (userId: number) => Promise<{
            updatedAt: string;
            version: number;
            widgets: {
                uid: string;
                width: 8 | 6 | 4 | 12;
            }[];
        } | null>;
        updateHomepageLayout: (userId: number, input: unknown) => Promise<{
            updatedAt: string;
            version: number;
            widgets: {
                uid: string;
                width: 8 | 6 | 4 | 12;
            }[];
        }>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map