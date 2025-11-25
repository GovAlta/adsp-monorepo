/// <reference types="lodash" />
import createPermissionsManager from './permission/permissions-manager';
import { cleanPermissionsInDatabase, createMany, deleteByIds, deleteByRolesIds, findMany, findUserPermissions } from './permission/queries';
declare const actionProvider: {
    hooks: {
        appliesPropertyToSubject: {
            call(context: unknown): Promise<any[]>;
            getHandlers(): import("@strapi/utils/dist/hooks").Handler[];
            register(handler: import("@strapi/utils/dist/hooks").Handler): import("@strapi/utils/dist/hooks").Hook<import("@strapi/utils/dist/hooks").Handler>;
            delete(handler: import("@strapi/utils/dist/hooks").Handler): import("@strapi/utils/dist/hooks").Hook<import("@strapi/utils/dist/hooks").Handler>;
        };
        willRegister: import("@strapi/utils/dist/hooks").AsyncSeriesHook;
        didRegister: import("@strapi/utils/dist/hooks").AsyncParallelHook;
        willDelete: import("@strapi/utils/dist/hooks").AsyncParallelHook;
        didDelete: import("@strapi/utils/dist/hooks").AsyncParallelHook;
    };
    register(actionAttributes: {
        section: string;
        displayName: string;
        category: string;
        subCategory?: string | undefined;
        pluginName?: string | undefined;
        subjects?: string[] | undefined;
        aliases?: import("../domain/action").ActionAlias[] | undefined;
        options?: {
            applyToProperties: string[] | null;
        } | undefined;
        uid: string;
    }): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    registerMany(actionsAttributes: {
        section: string;
        displayName: string;
        category: string;
        subCategory?: string | undefined;
        pluginName?: string | undefined;
        subjects?: string[] | undefined;
        aliases?: import("../domain/action").ActionAlias[] | undefined;
        options?: {
            applyToProperties: string[] | null;
        } | undefined;
        uid: string;
    }[]): Promise<any>;
    appliesToProperty(property: string, actionId: string, subject: string | null | undefined): Promise<boolean>;
    unstable_aliases(actionId: string, subject?: string | null | undefined): string[];
    delete(key: string): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    get(key: string): import("../domain/action").Action | undefined;
    values(): import("../domain/action").Action[];
    keys(): string[];
    has(key: string): boolean;
    size(): number;
    clear(): Promise<import("@strapi/utils/dist/provider-factory").Provider<import("../domain/action").Action>>;
};
declare const conditionProvider: {
    register(conditionAttributes: import("../domain/condition").CreateConditionPayload): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    registerMany(conditionsAttributes: import("../domain/condition").CreateConditionPayload[]): Promise<any>;
    hooks: import("@strapi/utils/dist/provider-factory").ProviderHooksMap;
    delete(key: string): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    get(key: string): {
        [x: string]: unknown;
    } | undefined;
    values(): {
        [x: string]: unknown;
    }[];
    keys(): string[];
    has(key: string): boolean;
    size(): number;
    clear(): Promise<import("@strapi/utils/dist/provider-factory").Provider<{
        [x: string]: unknown;
    }>>;
};
declare const sectionsBuilder: {
    createSection(sectionName: string, options: import("./permission/sections-builder/section").SectionOptions): any;
    deleteSection(sectionName: string): any;
    addHandler(sectionName: string, handler: () => unknown): any;
    addMatcher(sectionName: string, matcher: () => unknown): any;
    build(actions?: import("../domain/action").Action[]): Promise<any>;
};
declare const sanitizePermission: (p: import("../../../shared/contracts/shared").Permission) => import("../../../shared/contracts/roles").SanitizedPermission;
declare const engine: {
    readonly hooks: import("@strapi/permissions/dist/engine/hooks").PermissionEngineHooks;
    generateUserAbility(user: import("../../../shared/contracts/shared").AdminUser): Promise<import("@casl/ability").Ability<import("@casl/ability").AbilityTuple, any>>;
    checkMany: import("lodash").CurriedFunction2<import("@casl/ability").Ability<import("@casl/ability").AbilityTuple, any>, import("../../../shared/contracts/shared").Permission[], boolean[]>;
};
export { cleanPermissionsInDatabase, createMany, deleteByIds, deleteByRolesIds, findMany, findUserPermissions, createPermissionsManager, sectionsBuilder, sanitizePermission, engine, actionProvider, conditionProvider, };
//# sourceMappingURL=permission.d.ts.map