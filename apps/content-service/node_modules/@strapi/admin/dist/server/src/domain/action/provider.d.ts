import { providerFactory, hooks } from '@strapi/utils';
import type { Action, CreateActionPayload } from './index';
import type { Permission } from '../../../../shared/contracts/shared';
type Options = Parameters<typeof providerFactory>['0'];
/**
 * Creates a new instance of an action provider
 */
declare const createActionProvider: (options?: Options) => {
    hooks: {
        appliesPropertyToSubject: {
            call(context: unknown): Promise<any[]>;
            getHandlers(): hooks.Handler[];
            register(handler: hooks.Handler): hooks.Hook<hooks.Handler>;
            delete(handler: hooks.Handler): hooks.Hook<hooks.Handler>;
        };
        willRegister: hooks.AsyncSeriesHook;
        didRegister: hooks.AsyncParallelHook;
        willDelete: hooks.AsyncParallelHook;
        didDelete: hooks.AsyncParallelHook;
    };
    register(actionAttributes: CreateActionPayload): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    registerMany(actionsAttributes: CreateActionPayload[]): Promise<any>;
    appliesToProperty(property: string, actionId: string, subject: Permission['subject']): Promise<boolean>;
    /**
     * @experimental
     */
    unstable_aliases(actionId: string, subject?: string | null): string[];
    delete(key: string): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    get(key: string): Action | undefined;
    values(): Action[];
    keys(): string[];
    has(key: string): boolean;
    size(): number;
    clear(): Promise<import("@strapi/utils/dist/provider-factory").Provider<Action>>;
};
export default createActionProvider;
//# sourceMappingURL=provider.d.ts.map