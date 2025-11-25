/// <reference types="lodash" />
import { type engine } from '@strapi/permissions';
import type { Ability } from '@casl/ability';
import type { AdminUser, Permission } from '../../../../shared/contracts/shared';
declare const _default: (params: {
    providers: engine.EngineParams['providers'];
}) => {
    readonly hooks: import("@strapi/permissions/dist/engine/hooks").PermissionEngineHooks;
    /**
     * Generate an ability based on the given user (using associated roles & permissions)
     * @param user
     */
    generateUserAbility(user: AdminUser): Promise<Ability>;
    /**
     * Check many permissions based on an ability
     */
    checkMany: import("lodash").CurriedFunction2<Ability<import("@casl/ability").AbilityTuple, any>, Permission[], boolean[]>;
};
export default _default;
//# sourceMappingURL=engine.d.ts.map