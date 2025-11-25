import { hooks } from '@strapi/utils';
import type { Action } from '../../../domain/action';
export type SectionOptions = {
    initialStateFactory?: (...args: any) => unknown;
    handlers?: ((...args: any) => unknown)[];
    matchers?: ((...args: any) => unknown)[];
};
/**
 * Upon call, creates a new section object
 */
declare const createSection: ({ initialStateFactory, handlers, matchers }?: SectionOptions) => {
    hooks: {
        handlers: {
            call(context: unknown): Promise<void>;
            getHandlers(): hooks.Handler[];
            register(handler: hooks.Handler): hooks.Hook<hooks.Handler>;
            delete(handler: hooks.Handler): hooks.Hook<hooks.Handler>;
        };
        matchers: {
            call(context: unknown): Promise<any[]>;
            getHandlers(): hooks.Handler[];
            register(handler: hooks.Handler): hooks.Hook<hooks.Handler>;
            delete(handler: hooks.Handler): hooks.Hook<hooks.Handler>;
        };
    };
    /**
     * Verifies if an action can be applied to the section by running the matchers hook.
     * If any of the registered matcher functions returns true, then the condition applies.
     */
    appliesToAction(action: Action): Promise<boolean>;
    /**
     * Init, build and returns a section object based on the given actions
     * @param  actions - A list of actions used to populate the section
     */
    build(actions?: Action[]): Promise<unknown>;
};
export default createSection;
//# sourceMappingURL=section.d.ts.map