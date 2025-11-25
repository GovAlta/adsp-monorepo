import { Ability } from '@casl/ability';
import { providerFactory } from '@strapi/utils';
import type { PermissionEngineHooks, HookName } from './hooks';
import * as abilities from './abilities';
import { Permission } from '../domain/permission';
import type { PermissionRule } from '../types';
export { abilities };
type Provider = Omit<ReturnType<typeof providerFactory>, 'register'> & {
    register(...args: unknown[]): Promise<Provider> | Provider;
};
type ActionProvider = Provider;
type ConditionProvider = Provider;
export interface Engine {
    hooks: PermissionEngineHooks;
    on(hook: HookName, handler: (...args: any[]) => any): Engine;
    generateAbility(permissions: Permission[], options?: object): Promise<Ability>;
    createRegisterFunction(can: (permission: PermissionRule) => unknown, options: Record<string, unknown>): (permission: PermissionRule) => Promise<unknown>;
}
export interface EngineParams {
    providers: {
        action: ActionProvider;
        condition: ConditionProvider;
    };
    abilityBuilderFactory?(): abilities.CustomAbilityBuilder;
}
declare const newEngine: (params: EngineParams) => Engine;
export { newEngine as new };
//# sourceMappingURL=index.d.ts.map