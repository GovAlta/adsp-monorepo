import * as React from 'react';
import { MessageDescriptor, PrimitiveType } from 'react-intl';
import { RouteObject } from 'react-router-dom';
import { Permission } from '../../features/Auth';
import { StrapiApp } from '../../StrapiApp';
type Reducer<Config extends object> = (prev: Config[]) => Config[];
interface MenuItem {
    to: string;
    icon: React.ElementType;
    intlLabel: MessageDescriptor & {
        values?: Record<string, PrimitiveType>;
    };
    permissions: Permission[];
    notificationsCount?: number;
    Component?: React.LazyExoticComponent<React.ComponentType>;
    exact?: boolean;
    position?: number;
    licenseOnly?: boolean;
}
interface StrapiAppSettingLink extends Omit<MenuItem, 'icon' | 'notificationCount'> {
    id: string;
}
interface UnloadedSettingsLink extends Omit<StrapiAppSettingLink, 'Component'> {
    Component?: () => Promise<{
        default: React.ComponentType;
    }>;
}
interface StrapiAppSetting {
    id: string;
    intlLabel: MessageDescriptor & {
        values?: Record<string, PrimitiveType>;
    };
    links: Omit<StrapiAppSettingLink, 'Component'>[];
}
interface RouterOptions {
    basename?: string;
    memory?: boolean;
}
declare class Router {
    private _routes;
    private router;
    private _menu;
    private _settings;
    constructor(initialRoutes: RouteObject[]);
    get routes(): RouteObject[];
    get menu(): Omit<MenuItem, "Component">[];
    get settings(): Record<string, StrapiAppSetting>;
    /**
     * @internal This method is used internally by Strapi to create the router.
     * It should not be used by plugins, doing so will likely break the application.
     */
    createRouter(strapi: StrapiApp, { memory, ...opts }?: RouterOptions): import("@remix-run/router").Router;
    addMenuLink: (link: Omit<MenuItem, 'Component'> & {
        Component: () => Promise<{
            default: React.ComponentType;
        }>;
    }) => void;
    addSettingsLink(section: Pick<StrapiAppSetting, 'id' | 'intlLabel'> & {
        links: UnloadedSettingsLink[];
    }, links?: never): void;
    addSettingsLink(sectionId: string | Pick<StrapiAppSetting, 'id' | 'intlLabel'>, link: UnloadedSettingsLink): void;
    addSettingsLink(sectionId: string | Pick<StrapiAppSetting, 'id' | 'intlLabel'>, link: UnloadedSettingsLink[]): void;
    private createSettingsLink;
    /**
     * @alpha
     * @description Adds a route or an array of routes to the router.
     * Otherwise, pass a function that receives the current routes and
     * returns the new routes in a reducer like fashion.
     */
    addRoute(route: RouteObject | RouteObject[] | Reducer<RouteObject>): void;
}
export { Router };
export type { MenuItem, StrapiAppSettingLink, UnloadedSettingsLink, StrapiAppSetting, RouteObject };
