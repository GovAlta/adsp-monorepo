import { jsx } from 'react/jsx-runtime';
import 'react';
import invariant from 'invariant';
import { Provider } from 'react-redux';
import { createMemoryRouter, createBrowserRouter } from 'react-router-dom';
import { App } from '../../App.mjs';
import { ErrorElement } from '../../components/ErrorElement.mjs';
import { LanguageProvider } from '../../components/LanguageProvider.mjs';
import { Theme } from '../../components/Theme.mjs';
import { NotFoundPage } from '../../pages/NotFoundPage.mjs';
import { getImmutableRoutes } from '../../router.mjs';

class Router {
    get routes() {
        return this._routes;
    }
    get menu() {
        return this._menu;
    }
    get settings() {
        return this._settings;
    }
    /**
   * @internal This method is used internally by Strapi to create the router.
   * It should not be used by plugins, doing so will likely break the application.
   */ createRouter(strapi, { memory, ...opts } = {}) {
        const routes = [
            {
                path: '/*',
                errorElement: /*#__PURE__*/ jsx(Provider, {
                    store: strapi.store,
                    children: /*#__PURE__*/ jsx(LanguageProvider, {
                        messages: strapi.configurations.translations,
                        children: /*#__PURE__*/ jsx(Theme, {
                            themes: strapi.configurations.themes,
                            children: /*#__PURE__*/ jsx(ErrorElement, {})
                        })
                    })
                }),
                element: /*#__PURE__*/ jsx(App, {
                    strapi: strapi,
                    store: strapi.store
                }),
                children: [
                    ...getImmutableRoutes(),
                    {
                        path: '/*',
                        lazy: async ()=>{
                            const { PrivateAdminLayout } = await import('../../layouts/AuthenticatedLayout.mjs');
                            return {
                                Component: PrivateAdminLayout
                            };
                        },
                        children: [
                            ...this.routes,
                            {
                                path: '*',
                                element: /*#__PURE__*/ jsx(NotFoundPage, {})
                            }
                        ]
                    }
                ]
            }
        ];
        if (memory) {
            this.router = createMemoryRouter(routes, opts);
        } else {
            this.router = createBrowserRouter(routes, opts);
        }
        return this.router;
    }
    addSettingsLink(section, link) {
        if (typeof section === 'object' && 'links' in section) {
            /**
       * Someone has passed an entire pre-configured section object
       */ invariant(section.id, 'section.id should be defined');
            invariant(section.intlLabel?.id && section.intlLabel?.defaultMessage, 'section.intlLabel should be defined');
            invariant(this.settings[section.id] === undefined, 'A similar section already exists');
            invariant(Array.isArray(section.links), 'TypeError expected links to be an array');
            this.settings[section.id] = {
                ...section,
                links: []
            };
            section.links.forEach((link)=>{
                this.createSettingsLink(section.id, link);
            });
        } else if (typeof section === 'object' && link) {
            /**
       * we need to create the section first
       */ invariant(section.id, 'section.id should be defined');
            invariant(section.intlLabel?.id && section.intlLabel?.defaultMessage, 'section.intlLabel should be defined');
            invariant(this.settings[section.id] === undefined, 'A similar section already exists');
            this.settings[section.id] = {
                ...section,
                links: []
            };
            if (Array.isArray(link)) {
                link.forEach((l)=>this.createSettingsLink(section.id, l));
            } else {
                this.createSettingsLink(section.id, link);
            }
        } else if (typeof section === 'string' && link) {
            if (Array.isArray(link)) {
                link.forEach((l)=>this.createSettingsLink(section, l));
            } else {
                this.createSettingsLink(section, link);
            }
        } else {
            throw new Error('Invalid arguments provided to addSettingsLink, at minimum a sectionId and link are required.');
        }
    }
    /**
   * @alpha
   * @description Adds a route or an array of routes to the router.
   * Otherwise, pass a function that receives the current routes and
   * returns the new routes in a reducer like fashion.
   */ addRoute(route) {
        if (Array.isArray(route)) {
            this._routes = [
                ...this._routes,
                ...route
            ];
        } else if (typeof route === 'object' && route !== null) {
            this._routes.push(route);
        } else if (typeof route === 'function') {
            this._routes = route(this._routes);
        } else {
            throw new Error(`Expected the \`route\` passed to \`addRoute\` to be an array or a function, but received ${getPrintableType(route)}`);
        }
    }
    constructor(initialRoutes){
        this._routes = [];
        this.router = null;
        this._menu = [];
        this._settings = {
            global: {
                id: 'global',
                intlLabel: {
                    id: 'Settings.global',
                    defaultMessage: 'Global Settings'
                },
                links: []
            }
        };
        this.addMenuLink = (link)=>{
            invariant(link.to, `[${link.intlLabel.defaultMessage}]: link.to should be defined`);
            invariant(typeof link.to === 'string', `[${link.intlLabel.defaultMessage}]: Expected link.to to be a string instead received ${typeof link.to}`);
            invariant(link.intlLabel?.id && link.intlLabel?.defaultMessage, `[${link.intlLabel.defaultMessage}]: link.intlLabel.id & link.intlLabel.defaultMessage should be defined`);
            invariant(!link.Component || link.Component && typeof link.Component === 'function', `[${link.intlLabel.defaultMessage}]: link.Component must be a function returning a Promise that returns a default component. Please use: \`Component: () => import(path)\` instead.`);
            if (!link.Component || link.Component && typeof link.Component === 'function' && // @ts-expect-error – shh
            link.Component[Symbol.toStringTag] === 'AsyncFunction') {
                console.warn(`
      [${link.intlLabel.defaultMessage}]: [deprecated] addMenuLink() was called with an async Component from the plugin "${link.intlLabel.defaultMessage}". This will be removed in the future. Please use: \`Component: () => import(path)\` ensuring you return a default export instead.
      `.trim());
            }
            if (link.to.startsWith('/')) {
                console.warn(`[${link.intlLabel.defaultMessage}]: the \`to\` property of your menu link is an absolute path, it should be relative to the root of the application. This has been corrected for you but will be removed in a future version of Strapi.`);
                link.to = link.to.slice(1);
            }
            const { Component, ...restLink } = link;
            if (Component) {
                this._routes.push({
                    path: `${link.to}/*`,
                    lazy: async ()=>{
                        const mod = await Component();
                        if ('default' in mod) {
                            return {
                                Component: mod.default
                            };
                        } else {
                            return {
                                Component: mod
                            };
                        }
                    }
                });
            }
            this.menu.push(restLink);
        };
        this.createSettingsLink = (sectionId, link)=>{
            invariant(this._settings[sectionId], 'The section does not exist');
            invariant(link.id, `[${link.intlLabel.defaultMessage}]: link.id should be defined`);
            invariant(link.intlLabel?.id && link.intlLabel?.defaultMessage, `[${link.intlLabel.defaultMessage}]: link.intlLabel.id & link.intlLabel.defaultMessage`);
            invariant(link.to, `[${link.intlLabel.defaultMessage}]: link.to should be defined`);
            invariant(!link.Component || link.Component && typeof link.Component === 'function', `[${link.intlLabel.defaultMessage}]: link.Component must be a function returning a Promise. Please use: \`Component: () => import(path)\` instead.`);
            if (!link.Component || link.Component && typeof link.Component === 'function' && // @ts-expect-error – shh
            link.Component[Symbol.toStringTag] === 'AsyncFunction') {
                console.warn(`
      [${link.intlLabel.defaultMessage}]: [deprecated] addSettingsLink() was called with an async Component from the plugin "${link.intlLabel.defaultMessage}". This will be removed in the future. Please use: \`Component: () => import(path)\` ensuring you return a default export instead.
      `.trim());
            }
            if (link.to.startsWith('/')) {
                console.warn(`[${link.intlLabel.defaultMessage}]: the \`to\` property of your settings link is an absolute path. It should be relative to \`/settings\`. This has been corrected for you but will be removed in a future version of Strapi.`);
                link.to = link.to.slice(1);
            }
            if (link.to.split('/')[0] === 'settings') {
                console.warn(`[${link.intlLabel.defaultMessage}]: the \`to\` property of your settings link has \`settings\` as the first part of it's path. It should be relative to \`settings\` and therefore, not include it. This has been corrected for you but will be removed in a future version of Strapi.`);
                link.to = link.to.split('/').slice(1).join('/');
            }
            const { Component, ...restLink } = link;
            const settingsIndex = this._routes.findIndex((route)=>route.path === 'settings/*');
            /**
     * This shouldn't happen unless someone has removed the settings section completely.
     * Print a warning if this is the case though.
     */ if (!settingsIndex) {
                console.warn('A third party plugin has removed the settings section, the settings link cannot be added.');
                return;
            } else if (!this._routes[settingsIndex].children) {
                this._routes[settingsIndex].children = [];
            }
            if (Component) {
                this._routes[settingsIndex].children.push({
                    path: `${link.to}/*`,
                    lazy: async ()=>{
                        const mod = await Component();
                        if ('default' in mod) {
                            return {
                                Component: mod.default
                            };
                        } else {
                            return {
                                Component: mod
                            };
                        }
                    }
                });
            }
            this._settings[sectionId].links.push(restLink);
        };
        this._routes = initialRoutes;
    }
}
/* -------------------------------------------------------------------------------------------------
 * getPrintableType
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal
 * @description Gets the human-friendly printable type name for the given value, for instance it will yield
 * `array` instead of `object`, as the native `typeof` operator would do.
 */ const getPrintableType = (value)=>{
    const nativeType = typeof value;
    if (nativeType === 'object') {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (value instanceof Object && value.constructor.name !== 'Object') {
            return value.constructor.name;
        }
    }
    return nativeType;
};

export { Router };
//# sourceMappingURL=router.mjs.map
