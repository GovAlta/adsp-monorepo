'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var invariant = require('invariant');
var isFunction = require('lodash/isFunction');
var merge = require('lodash/merge');
var pick = require('lodash/pick');
var reactRouterDom = require('react-router-dom');
var constants = require('../../ee/admin/src/constants.js');
var logoStrapi2022 = require('./assets/images/logo-strapi-2022.svg.js');
var constants$1 = require('./constants.js');
var CustomFields = require('./core/apis/CustomFields.js');
var Plugin = require('./core/apis/Plugin.js');
var rbac = require('./core/apis/rbac.js');
var router = require('./core/apis/router.js');
var Widgets = require('./core/apis/Widgets.js');
var configure = require('./core/store/configure.js');
var basename = require('./core/utils/basename.js');
var createHook = require('./core/utils/createHook.js');
var reducer = require('./reducer.js');
var router$1 = require('./router.js');
var languageNativeNames = require('./translations/languageNativeNames.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function __variableDynamicImportRuntime4__(path) {
  switch (path) {
    case './translations/ar.json': return Promise.resolve().then(function () { return require('./translations/ar.json.js'); });
    case './translations/ca.json': return Promise.resolve().then(function () { return require('./translations/ca.json.js'); });
    case './translations/cs.json': return Promise.resolve().then(function () { return require('./translations/cs.json.js'); });
    case './translations/de.json': return Promise.resolve().then(function () { return require('./translations/de.json.js'); });
    case './translations/dk.json': return Promise.resolve().then(function () { return require('./translations/dk.json.js'); });
    case './translations/en.json': return Promise.resolve().then(function () { return require('./translations/en.json.js'); });
    case './translations/es.json': return Promise.resolve().then(function () { return require('./translations/es.json.js'); });
    case './translations/eu.json': return Promise.resolve().then(function () { return require('./translations/eu.json.js'); });
    case './translations/fr.json': return Promise.resolve().then(function () { return require('./translations/fr.json.js'); });
    case './translations/gu.json': return Promise.resolve().then(function () { return require('./translations/gu.json.js'); });
    case './translations/he.json': return Promise.resolve().then(function () { return require('./translations/he.json.js'); });
    case './translations/hi.json': return Promise.resolve().then(function () { return require('./translations/hi.json.js'); });
    case './translations/hu.json': return Promise.resolve().then(function () { return require('./translations/hu.json.js'); });
    case './translations/id.json': return Promise.resolve().then(function () { return require('./translations/id.json.js'); });
    case './translations/it.json': return Promise.resolve().then(function () { return require('./translations/it.json.js'); });
    case './translations/ja.json': return Promise.resolve().then(function () { return require('./translations/ja.json.js'); });
    case './translations/ko.json': return Promise.resolve().then(function () { return require('./translations/ko.json.js'); });
    case './translations/ml.json': return Promise.resolve().then(function () { return require('./translations/ml.json.js'); });
    case './translations/ms.json': return Promise.resolve().then(function () { return require('./translations/ms.json.js'); });
    case './translations/nl.json': return Promise.resolve().then(function () { return require('./translations/nl.json.js'); });
    case './translations/no.json': return Promise.resolve().then(function () { return require('./translations/no.json.js'); });
    case './translations/pl.json': return Promise.resolve().then(function () { return require('./translations/pl.json.js'); });
    case './translations/pt-BR.json': return Promise.resolve().then(function () { return require('./translations/pt-BR.json.js'); });
    case './translations/pt.json': return Promise.resolve().then(function () { return require('./translations/pt.json.js'); });
    case './translations/ru.json': return Promise.resolve().then(function () { return require('./translations/ru.json.js'); });
    case './translations/sa.json': return Promise.resolve().then(function () { return require('./translations/sa.json.js'); });
    case './translations/sk.json': return Promise.resolve().then(function () { return require('./translations/sk.json.js'); });
    case './translations/sv.json': return Promise.resolve().then(function () { return require('./translations/sv.json.js'); });
    case './translations/th.json': return Promise.resolve().then(function () { return require('./translations/th.json.js'); });
    case './translations/tr.json': return Promise.resolve().then(function () { return require('./translations/tr.json.js'); });
    case './translations/uk.json': return Promise.resolve().then(function () { return require('./translations/uk.json.js'); });
    case './translations/vi.json': return Promise.resolve().then(function () { return require('./translations/vi.json.js'); });
    case './translations/zh-Hans.json': return Promise.resolve().then(function () { return require('./translations/zh-Hans.json.js'); });
    case './translations/zh.json': return Promise.resolve().then(function () { return require('./translations/zh.json.js'); });
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }

function __variableDynamicImportRuntime3__(path) {
  switch (path) {
    case './translations/en-GB.js': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/en-GB.js')); });
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }
const { INJECT_COLUMN_IN_TABLE, MUTATE_COLLECTION_TYPES_LINKS, MUTATE_EDIT_VIEW_LAYOUT, MUTATE_SINGLE_TYPES_LINKS } = constants$1.HOOKS;
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
                icon: icons.User,
                title: {
                    id: 'widget.profile.title',
                    defaultMessage: 'Profile'
                },
                component: async ()=>{
                    const { ProfileWidget } = await Promise.resolve().then(function () { return require('./components/Widgets.js'); });
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
                icon: icons.TrendUp,
                title: {
                    id: 'widget.key-statistics.title',
                    defaultMessage: 'Project statistics'
                },
                component: async ()=>{
                    const { KeyStatisticsWidget } = await Promise.resolve().then(function () { return require('./components/Widgets.js'); });
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
                    icon: icons.Clock,
                    title: {
                        id: 'widget.last-activity.title',
                        defaultMessage: 'Last activity'
                    },
                    component: async ()=>{
                        const { AuditLogsWidget } = await Promise.resolve().then(function () { return require('../../ee/admin/src/components/AuditLogs/Widgets.js'); });
                        return AuditLogsWidget;
                    },
                    pluginId: 'admin',
                    id: 'audit-logs',
                    link: {
                        label: {
                            id: 'widget.last-activity.link',
                            defaultMessage: 'Open Audit Logs'
                        },
                        href: `/settings/audit-logs?pageSize=${constants.AUDIT_LOGS_DEFAULT_PAGE_SIZE}&page=1&sort=date:DESC`
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
        const localeNames = pick(languageNativeNames.languageNativeNames, this.configurations.locales || []);
        const locale = localStorage.getItem(reducer.LANGUAGE_LOCAL_STORAGE_KEY) || 'en';
        this.store = configure.configureStore({
            admin_app: {
                permissions: merge({}, constants$1.ADMIN_PERMISSIONS_CE, constants.ADMIN_PERMISSIONS_EE),
                theme: {
                    availableThemes: [],
                    currentTheme: localStorage.getItem(reducer.THEME_LOCAL_STORAGE_KEY) || 'system'
                },
                language: {
                    locale: localeNames[locale] ? locale : 'en',
                    localeNames
                },
                token: reducer.getStoredToken()
            }
        }, this.middlewares, this.reducers);
        const router = this.router.createRouter(this, {
            basename: basename.getBasename()
        });
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.RouterProvider, {
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
            authLogo: logoStrapi2022,
            head: {
                favicon: ''
            },
            locales: [
                'en'
            ],
            menuLogo: logoStrapi2022,
            notifications: {
                releases: true
            },
            themes: {
                light: designSystem.lightTheme,
                dark: designSystem.darkTheme
            },
            translations: {},
            tutorials: true
        };
        /**
   * APIs
   */ this.rbac = new rbac.RBAC();
        this.library = {
            components: {},
            fields: {}
        };
        this.middlewares = [];
        this.reducers = {};
        this.store = null;
        this.customFields = new CustomFields.CustomFields();
        this.widgets = new Widgets.Widgets();
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
            this.hooksDict[name] = createHook.createHook();
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
            const plugin = new Plugin.Plugin(pluginConf);
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
        this.router = new router.Router(router$1.getInitialRoutes());
    }
}

exports.StrapiApp = StrapiApp;
//# sourceMappingURL=StrapiApp.js.map
