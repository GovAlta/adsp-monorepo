import { hooks } from '@strapi/utils';
import * as domain from '../domain';
import type { Permission } from '../domain/permission';
import type { PermissionRule } from '../types';
export interface PermissionEngineHooks {
    'before-format::validate.permission': ReturnType<typeof hooks.createAsyncBailHook>;
    'format.permission': ReturnType<typeof hooks.createAsyncSeriesWaterfallHook>;
    'after-format::validate.permission': ReturnType<typeof hooks.createAsyncBailHook>;
    'before-evaluate.permission': ReturnType<typeof hooks.createAsyncSeriesHook>;
    'before-register.permission': ReturnType<typeof hooks.createAsyncSeriesHook>;
}
export type HookName = keyof PermissionEngineHooks;
/**
 * Create a hook map used by the permission Engine
 */
declare const createEngineHooks: () => PermissionEngineHooks;
/**
 * Create a context from a domain {@link Permission} used by the validate hooks
 */
declare const createValidateContext: (permission: Permission) => {
    readonly permission: Readonly<domain.permission.Permission>;
};
/**
 * Create a context from a domain {@link Permission} used by the before valuate hook
 */
declare const createBeforeEvaluateContext: (permission: Permission) => {
    readonly permission: Readonly<domain.permission.Permission>;
    addCondition(condition: string): {
        readonly permission: Readonly<domain.permission.Permission>;
        addCondition(condition: string): any;
    };
};
interface WillRegisterContextParams {
    permission: PermissionRule;
    options: Record<string, unknown>;
}
/**
 * Create a context from a casl Permission & some options
 * @param caslPermission
 */
declare const createWillRegisterContext: ({ permission, options }: WillRegisterContextParams) => {
    permission: PermissionRule;
    condition: {
        and(rawConditionObject: unknown): {
            and(rawConditionObject: unknown): any;
            or(rawConditionObject: unknown): any;
        };
        or(rawConditionObject: unknown): {
            and(rawConditionObject: unknown): any;
            or(rawConditionObject: unknown): any;
        };
    };
};
export { createEngineHooks, createValidateContext, createBeforeEvaluateContext, createWillRegisterContext, };
//# sourceMappingURL=hooks.d.ts.map