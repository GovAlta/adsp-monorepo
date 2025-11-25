import { jsx } from 'react/jsx-runtime';
import 'react';
import { lightTheme, darkTheme } from '@strapi/design-system';
import { User, TrendUp, Clock } from '@strapi/icons';
import invariant from 'invariant';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import pick from 'lodash/pick';
import { RouterProvider } from 'react-router-dom';
import { AUDIT_LOGS_DEFAULT_PAGE_SIZE, ADMIN_PERMISSIONS_EE } from '../../ee/admin/src/constants.mjs';
import img from './assets/images/logo-strapi-2022.svg.mjs';
import { ADMIN_PERMISSIONS_CE, HOOKS } from './constants.mjs';
import { CustomFields } from './core/apis/CustomFields.mjs';
import { Plugin } from './core/apis/Plugin.mjs';
import { RBAC } from './core/apis/rbac.mjs';
import { Router } from './core/apis/router.mjs';
import { Widgets } from './core/apis/Widgets.mjs';
import { configureStore as configureStoreImpl } from './core/store/configure.mjs';
import { getBasename } from './core/utils/basename.mjs';
import { createHook } from './core/utils/createHook.mjs';
import { LANGUAGE_LOCAL_STORAGE_KEY, THEME_LOCAL_STORAGE_KEY, getStoredToken } from './reducer.mjs';
import { getInitialRoutes } from './router.mjs';
import { languageNativeNames } from './translations/languageNativeNames.mjs';

function __variableDynamicImportRuntime4__(path) {
  switch (path) {
    case './translations/ar.json': return import('./translations/ar.json.mjs');
    case './translations/ca.json': return import('./translations/ca.json.mjs');
    case './translations/cs.json': return import('./translations/cs.json.mjs');
    case './translations/de.json': return import('./translations/de.json.mjs');
    case './translations/dk.json': return import('./translations/dk.json.mjs');
    case './translations/en.json': return import('./translations/en.json.mjs');
    case './translations/es.json': return import('./translations/es.json.mjs');
    case './translations/eu.json': return import('./translations/eu.json.mjs');
    case './translations/fr.json': return import('./translations/fr.json.mjs');
    case './translations/gu.json': return import('./translations/gu.json.mjs');
    case './translations/he.json': return import('./translations/he.json.mjs');
    case './translations/hi.json': return import('./translations/hi.json.mjs');
    case './translations/hu.json': return import('./translations/hu.json.mjs');
    case './translations/id.json': return import('./translations/id.json.mjs');
    case './translations/it.json': return import('./translations/it.json.mjs');
    case './translations/ja.json': return import('./translations/ja.json.mjs');
    case './translations/ko.json': return import('./translations/ko.json.mjs');
    case './translations/ml.json': return import('./translations/ml.json.mjs');
    case './translations/ms.json': return import('./translations/ms.json.mjs');
    case './translations/nl.json': return import('./translations/nl.json.mjs');
    case './translations/no.json': return import('./translations/no.json.mjs');
    case './translations/pl.json': return import('./translations/pl.json.mjs');
    case './translations/pt-BR.json': return import('./translations/pt-BR.json.mjs');
    case './translations/pt.json': return import('./translations/pt.json.mjs');
    case './translations/ru.json': return import('./translations/ru.json.mjs');
    case './translations/sa.json': return import('./translations/sa.json.mjs');
    case './translations/sk.json': return import('./translations/sk.json.mjs');
    case './translations/sv.json': return import('./translations/sv.json.mjs');
    case './translations/th.json': return import('./translations/th.json.mjs');
    case './translations/tr.json': return import('./translations/tr.json.mjs');
    case './translations/uk.json': return import('./translations/uk.json.mjs');
    case './translations/vi.json': return import('./translations/vi.json.mjs');
    case './translations/zh-Hans.json': return import('./translations/zh-Hans.json.mjs');
    case './translations/zh.json': return import('./translations/zh.json.mjs');
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }

function __variableDynamicImportRuntime3__(path) {
  switch (path) {
    case './translations/en-GB.js': return import('./translations/en-GB.mjs');
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }
const { INJECT_COLUMN_IN_TABLE, MUTATE_COLLECTION_TYPES_LINKS, MUTATE_EDIT_VIEW_LAYOUT, MUTATE_SINGLE_TYPES_LINKS } = HOOKS;
class StrapiApp {
    async bootstrap(customBootstrap) {
        Object.keys(this.appPlugins).forEach((plugin)=>{
            const bootstrap = this.appPlugins[plugin].bootstrap;
            if (bootstrap) {
                bootstrap({
                    addSettingsLink: this.addSettingsLink,
                    addSettingsLinks: this.addSettingsLinks,
                    getPlugin: this.getPlugin,
                    registerHook: this.registerHook
                });
            }
        });
        if (isFunction(customBootstrap)) {
            customBootstrap({
                addComponents: this.addComponents,
                addFields: this.addFields,
                addMenuLink: this.addMenuLink,
                addReducers: this.addReducers,
                addSettingsLink: this.addSettingsLink,
                addSettingsLinks: this.addSettingsLinks,
                getPlugin: this.getPlugin,
                registerHook: this.registerHook
            });
        }
    }
    async register(customRegister) {
        this.widgets.register([
            {
                icon: User,
                title: {
                    id: 'widget.profile.title',
                    defaultMessage: 'Profile'
                },
                component: async ()=>{
                    const { ProfileWidget } = await import('./components/Widgets.mjs');
                    return ProfileWidget;
                },
                pluginId: 'admin',
                id: 'profile-info',
                link: {
                    label: {
                        id: 'global.profile.settings',
                        defaultMessage: 'Profile settings'
                    },
                    href: '/me'
                }
            },
            {
                icon: TrendUp,
                title: {
                    id: 'widget.key-statistics.title',
                    defaultMessage: 'Project statistics'
                },
                component: async ()=>{
                    const { KeyStatisticsWidget } = await import('./components/Widgets.mjs');
                    return KeyStatisticsWidget;
                },
                pluginId: 'admin',
                id: 'key-statistics',
                roles: [
                    'strapi-super-admin'
                ]
            }
        ]);
        Object.keys(this.appPlugins).forEach((plugin)=>{
            this.appPlugins[plugin].register(this);
        });
        if (isFunction(customRegister)) {
            customRegister(this);
        }
        // Register Audit Logs widget at the end of the widgets array
        if (window.strapi.features.isEnabled(window.strapi.features.AUDIT_LOGS)) {
            this.widgets.register([
                {
                    icon: Clock,
                    title: {
                        id: 'widget.last-activity.title',
                        defaultMessage: 'Last activity'
                    },
                    component: async ()=>{
                        const { AuditLogsWidget } = await import('../../ee/admin/src/components/AuditLogs/Widgets.mjs');
                        return AuditLogsWidget;
                    },
                    pluginId: 'admin',
                    id: 'audit-logs',
                    link: {
                        label: {
                            id: 'widget.last-activity.link',
                            defaultMessage: 'Open Audit Logs'
                        },
                        href: `/settings/audit-logs?pageSize=${AUDIT_LOGS_DEFAULT_PAGE_SIZE}&page=1&sort=date:DESC`
                    },
                    permissions: [
                        {
                            action: 'admin::audit-logs.read'
                        }
                    ]
                }
            ]);
        }
    }
    async loadAdminTrads() {
        const adminLocales = await Promise.all(this.configurations.locales.map(async (locale)=>{
            try {
                const { default: data } = await __variableDynamicImportRuntime3__(`./translations/${locale}.js`);
                return {
                    data,
                    locale
                };
            } catch  {
                try {
                    const { default: data } = await __variableDynamicImportRuntime4__(`./translations/${locale}.json`);
                    return {
                        data,
                        locale
                    };
                } catch  {
                    return {
                        data: null,
                        locale
                    };
                }
            }
        }));
        return adminLocales.reduce((acc, current)=>{
            if (current.data) {
                acc[current.locale] = current.data;
            }
            return acc;
        }, {});
    }
    /**
   * Load the application's translations and merged the custom translations
   * with the default ones.
   */ async loadTrads(customTranslations = {}) {
        const adminTranslations = await this.loadAdminTrads();
        const arrayOfPromises = Object.keys(this.appPlugins).map((plugin)=>{
            const registerTrads = this.appPlugins[plugin].registerTrads;
            if (registerTrads) {
                return registerTrads({
                    locales: this.configurations.locales
                });
            }
            return null;
        }).filter((a)=>a);
        const pluginsTrads = await Promise.all(arrayOfPromises);
        const mergedTrads = pluginsTrads.reduce((acc, currentPluginTrads)=>{
            const pluginTrads = currentPluginTrads.reduce((acc1, current)=>{
                acc1[current.locale] = current.data;
                return acc1;
            }, {});
            Object.keys(pluginTrads).forEach((locale)=>{
                acc[locale] = {
                    ...acc[locale],
                    ...pluginTrads[locale]
                };
            });
            return acc;
        }, {});
        const translations = this.configurations.locales.reduce((acc, current)=>{
            acc[current] = {
                ...adminTranslations[current],
                ...mergedTrads[current] || {},
                ...customTranslations[current] ?? {}
            };
            return acc;
        }, {});
        this.configurations.translations = translations;
        return Promise.resolve();
    }
    render() {
        const localeNames = pick(languageNativeNames, this.configurations.locales || []);
        const locale = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) || 'en';
        this.store = configureStoreImpl({
            admin_app: {
                permissions: merge({}, ADMIN_PERMISSIONS_CE, ADMIN_PERMISSIONS_EE),
                theme: {
                    availableThemes: [],
                    currentTheme: localStorage.getItem(THEME_LOCAL_STORAGE_KEY) || 'system'
                },
                language: {
                    locale: localeNames[locale] ? locale : 'en',
                    localeNames
                },
                token: getStoredToken()
            }
        }, this.middlewares, this.reducers);
        const router = this.router.createRouter(this, {
            basename: getBasename()
        });
        return /*#__PURE__*/ jsx(RouterProvider, {
            router: router
        });
    }
    constructor({ config, appPlugins } = {}){
        this.plugins = {};
        this.hooksDict = {};
        this.admin = {
            injectionZones: {}
        };
        this.translations = {};
        this.configurations = {
            authLogo: img,
            head: {
                favicon: ''
            },
            locales: [
                'en'
            ],
            menuLogo: img,
            notifications: {
                releases: true
            },
            themes: {
                light: lightTheme,
                dark: darkTheme
            },
            translations: {},
            tutorials: true
        };
        /**
   * APIs
   */ this.rbac = new RBAC();
        this.library = {
            components: {},
            fields: {}
        };
        this.middlewares = [];
        this.reducers = {};
        this.store = null;
        this.customFields = new CustomFields();
        this.widgets = new Widgets();
        this.addComponents = (components)=>{
            if (Array.isArray(components)) {
                components.map((comp)=>{
                    invariant(comp.Component, 'A Component must be provided');
                    invariant(comp.name, 'A type must be provided');
                    this.library.components[comp.name] = comp.Component;
                });
            } else {
                invariant(components.Component, 'A Component must be provided');
                invariant(components.name, 'A type must be provided');
                this.library.components[components.name] = components.Component;
            }
        };
        this.addFields = (fields)=>{
            if (Array.isArray(fields)) {
                fields.map((field)=>{
                    invariant(field.Component, 'A Component must be provided');
                    invariant(field.type, 'A type must be provided');
                    this.library.fields[field.type] = field.Component;
                });
            } else {
                invariant(fields.Component, 'A Component must be provided');
                invariant(fields.type, 'A type must be provided');
                this.library.fields[fields.type] = fields.Component;
            }
        };
        this.addMiddlewares = (middlewares)=>{
            middlewares.forEach((middleware)=>{
                this.middlewares.push(middleware);
            });
        };
        this.addRBACMiddleware = (m)=>{
            if (Array.isArray(m)) {
                this.rbac.use(m);
            } else {
                this.rbac.use(m);
            }
        };
        this.addReducers = (reducers)=>{
            /**
     * TODO: when we upgrade to redux-toolkit@2 and we can also dynamically add middleware,
     * we'll deprecate these two APIs in favour of their hook counterparts.
     */ Object.entries(reducers).forEach(([name, reducer])=>{
                this.reducers[name] = reducer;
            });
        };
        this.addMenuLink = (link)=>this.router.addMenuLink(link);
        /**
   * @deprecated use `addSettingsLink` instead, it internally supports
   * adding multiple links at once.
   */ this.addSettingsLinks = (sectionId, links)=>{
            invariant(Array.isArray(links), 'TypeError expected links to be an array');
            this.router.addSettingsLink(sectionId, links);
        };
        /**
   * @deprecated use `addSettingsLink` instead, you can pass a section object to
   * create the section and links at the same time.
   */ this.createSettingSection = (section, links)=>this.router.addSettingsLink(section, links);
        this.addSettingsLink = (sectionId, link)=>{
            this.router.addSettingsLink(sectionId, link);
        };
        this.createCustomConfigurations = (customConfig)=>{
            if (customConfig.locales) {
                this.configurations.locales = [
                    'en',
                    ...customConfig.locales?.filter((loc)=>loc !== 'en') || []
                ];
            }
            if (customConfig.auth?.logo) {
                this.configurations.authLogo = customConfig.auth.logo;
            }
            if (customConfig.menu?.logo) {
                this.configurations.menuLogo = customConfig.menu.logo;
            }
            if (customConfig.head?.favicon) {
                this.configurations.head.favicon = customConfig.head.favicon;
            }
            if (customConfig.theme) {
                const darkTheme = customConfig.theme.dark;
                const lightTheme = customConfig.theme.light;
                if (!darkTheme && !lightTheme) {
                    console.warn(`[deprecated] In future versions, Strapi will stop supporting this theme customization syntax. The theme configuration accepts a light and a dark key to customize each theme separately. See https://docs.strapi.io/developer-docs/latest/development/admin-customization.html#theme-extension.`.trim());
                    merge(this.configurations.themes.light, customConfig.theme);
                }
                if (lightTheme) merge(this.configurations.themes.light, lightTheme);
                if (darkTheme) merge(this.configurations.themes.dark, darkTheme);
            }
            if (customConfig.notifications?.releases !== undefined) {
                this.configurations.notifications.releases = customConfig.notifications.releases;
            }
            if (customConfig.tutorials !== undefined) {
                this.configurations.tutorials = customConfig.tutorials;
            }
        };
        this.createHook = (name)=>{
            this.hooksDict[name] = createHook();
        };
        this.getAdminInjectedComponents = (moduleName, containerName, blockName)=>{
            try {
                // @ts-expect-error – we have a catch block so if you don't pass it correctly we still return an array.
                return this.admin.injectionZones[moduleName][containerName][blockName] || [];
            } catch (err) {
                console.error('Cannot get injected component', err);
                return [];
            }
        };
        this.getPlugin = (pluginId)=>this.plugins[pluginId];
        this.registerHook = (name, fn)=>{
            invariant(this.hooksDict[name], `The hook ${name} is not defined. You are trying to register a hook that does not exist in the application.`);
            this.hooksDict[name].register(fn);
        };
        this.registerPlugin = (pluginConf)=>{
            const plugin = new Plugin(pluginConf);
            this.plugins[plugin.pluginId] = plugin;
        };
        this.runHookSeries = (name, asynchronous = false)=>asynchronous ? this.hooksDict[name].runSeriesAsync() : this.hooksDict[name].runSeries();
        this.runHookWaterfall = (name, initialValue, store)=>{
            return this.hooksDict[name].runWaterfall(initialValue, store);
        };
        this.runHookParallel = (name)=>this.hooksDict[name].runParallel();
        this.appPlugins = appPlugins || {};
        this.createCustomConfigurations(config ?? {});
        this.createHook(INJECT_COLUMN_IN_TABLE);
        this.createHook(MUTATE_COLLECTION_TYPES_LINKS);
        this.createHook(MUTATE_SINGLE_TYPES_LINKS);
        this.createHook(MUTATE_EDIT_VIEW_LAYOUT);
        this.router = new Router(getInitialRoutes());
    }
}

export { StrapiApp };
//# sourceMappingURL=StrapiApp.mjs.map
