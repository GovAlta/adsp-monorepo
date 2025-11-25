import * as React from 'react';
import { CustomFields } from './core/apis/CustomFields';
import { Plugin, PluginConfig } from './core/apis/Plugin';
import { RBAC, RBACMiddleware } from './core/apis/rbac';
import { Router, StrapiAppSetting, UnloadedSettingsLink } from './core/apis/router';
import { Widgets } from './core/apis/Widgets';
import { RootState, Store } from './core/store/configure';
import { Handler, createHook } from './core/utils/createHook';
import type { ReducersMapObject, Middleware } from '@reduxjs/toolkit';
import type { DefaultTheme } from 'styled-components';
interface StrapiAppConstructorArgs extends Partial<Pick<StrapiApp, 'appPlugins'>> {
    config?: {
        auth?: {
            logo: string;
        };
        head?: {
            favicon: string;
        };
        locales?: string[];
        menu?: {
            logo: string;
        };
        notifications?: {
            releases: boolean;
        };
        theme?: {
            light: DefaultTheme;
            dark: DefaultTheme;
        };
        translations?: Record<string, Record<string, string>>;
        tutorials?: boolean;
    };
}
type Translation = {
    data: Record<string, string>;
    locale: string;
};
type Translations = Array<Translation>;
interface StrapiAppPlugin {
    bootstrap?: (args: Pick<StrapiApp, 'addSettingsLink' | 'addSettingsLinks' | 'getPlugin' | 'registerHook'>) => void;
    register: (app: StrapiApp) => void;
    registerTrads?: (args: {
        locales: string[];
    }) => Promise<Translations>;
}
interface InjectionZoneComponent {
    Component: React.ComponentType;
    name: string;
    slug: string;
}
interface Component {
    name: string;
    Component: React.ComponentType;
}
interface Field {
    type: string;
    Component: React.ComponentType;
}
interface Library {
    fields: Record<Field['type'], Field['Component']>;
    components: Record<Component['name'], Component['Component']>;
}
declare class StrapiApp {
    appPlugins: Record<string, StrapiAppPlugin>;
    plugins: Record<string, Plugin>;
    hooksDict: Record<string, ReturnType<typeof createHook>>;
    admin: {
        injectionZones: {};
    };
    translations: StrapiApp['configurations']['translations'];
    configurations: {
        authLogo: string;
        head: {
            favicon: string;
        };
        locales: string[];
        menuLogo: string;
        notifications: {
            releases: boolean;
        };
        themes: {
            light: DefaultTheme;
            dark: DefaultTheme;
        };
        translations: {};
        tutorials: boolean;
    };
    /**
     * APIs
     */
    rbac: RBAC;
    router: Router;
    library: Library;
    middlewares: Array<() => Middleware<object, RootState>>;
    reducers: ReducersMapObject;
    store: Store | null;
    customFields: CustomFields;
    widgets: Widgets;
    constructor({ config, appPlugins }?: StrapiAppConstructorArgs);
    addComponents: (components: Component | Component[]) => void;
    addFields: (fields: Field | Field[]) => void;
    addMiddlewares: (middlewares: StrapiApp['middlewares']) => void;
    addRBACMiddleware: (m: RBACMiddleware | RBACMiddleware[]) => void;
    addReducers: (reducers: ReducersMapObject) => void;
    addMenuLink: (link: Parameters<typeof this.router.addMenuLink>[0]) => void;
    /**
     * @deprecated use `addSettingsLink` instead, it internally supports
     * adding multiple links at once.
     */
    addSettingsLinks: (sectionId: string, links: UnloadedSettingsLink[]) => void;
    /**
     * @deprecated use `addSettingsLink` instead, you can pass a section object to
     * create the section and links at the same time.
     */
    createSettingSection: (section: Pick<StrapiAppSetting, 'id' | 'intlLabel'>, links: UnloadedSettingsLink[]) => void;
    addSettingsLink: (sectionId: string | Pick<StrapiAppSetting, 'id' | 'intlLabel'>, link: UnloadedSettingsLink) => void;
    bootstrap(customBootstrap?: unknown): Promise<void>;
    createCustomConfigurations: (customConfig: NonNullable<StrapiAppConstructorArgs['config']>) => void;
    createHook: (name: string) => void;
    getAdminInjectedComponents: (moduleName: string, containerName: string, blockName: string) => InjectionZoneComponent[];
    getPlugin: (pluginId: PluginConfig['id']) => Plugin;
    register(customRegister?: unknown): Promise<void>;
    loadAdminTrads(): Promise<{
        [locale: string]: Record<string, string>;
    }>;
    /**
     * Load the application's translations and merged the custom translations
     * with the default ones.
     */
    loadTrads(customTranslations?: Record<string, Record<string, string>>): Promise<void>;
    registerHook: (name: string, fn: Handler) => void;
    registerPlugin: (pluginConf: PluginConfig) => void;
    runHookSeries: (name: string, asynchronous?: boolean) => any[] | Promise<any[]>;
    runHookWaterfall: <T>(name: string, initialValue: T, store?: Store) => T;
    runHookParallel: (name: string) => Promise<any[]>;
    render(): import("react/jsx-runtime").JSX.Element;
}
export { StrapiApp };
export type { StrapiAppPlugin, StrapiAppConstructorArgs, InjectionZoneComponent };
