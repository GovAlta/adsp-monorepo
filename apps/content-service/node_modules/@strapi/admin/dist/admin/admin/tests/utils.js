'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var toolkit = require('@reduxjs/toolkit');
var adminTestUtils = require('@strapi/admin-test-utils');
var designSystem = require('@strapi/design-system');
var react = require('@testing-library/react');
var userEvent = require('@testing-library/user-event');
var reactDnd = require('react-dnd');
var reactDndHtml5Backend = require('react-dnd-html5-backend');
var reactQuery = require('react-query');
var reactRedux = require('react-redux');
var reactRouterDom = require('react-router-dom');
var Context = require('../src/components/GuidedTour/Context.js');
var LanguageProvider = require('../src/components/LanguageProvider.js');
var Theme = require('../src/components/Theme.js');
var rbac = require('../src/core/apis/rbac.js');
var AppInfo = require('../src/features/AppInfo.js');
var Auth = require('../src/features/Auth.js');
var Configuration = require('../src/features/Configuration.js');
var Notifications = require('../src/features/Notifications.js');
var StrapiApp = require('../src/features/StrapiApp.js');
var reducer = require('../src/reducer.js');
var api = require('../src/services/api.js');
var server = require('./server.js');
var store = require('./store.js');

reactQuery.setLogger({
    log: ()=>{},
    warn: ()=>{},
    error: ()=>{}
});
const defaultTestStoreConfig = ()=>({
        preloadedState: store.initialState(),
        reducer: {
            [api.adminApi.reducerPath]: api.adminApi.reducer,
            admin_app: reducer.reducer
        },
        // @ts-expect-error – this fails.
        middleware: (getDefaultMiddleware)=>[
                ...getDefaultMiddleware({
                    // Disable timing checks for test env
                    immutableCheck: false,
                    serializableCheck: false
                }),
                api.adminApi.middleware
            ]
    });
const DEFAULT_PERMISSIONS = [
    ...adminTestUtils.fixtures.permissions.allPermissions,
    {
        id: 314,
        action: 'admin::users.read',
        subject: null,
        properties: {},
        conditions: [],
        actionParameters: {}
    }
];
const Providers = ({ children, initialEntries, storeConfig, permissions = [] })=>{
    const queryClient = new reactQuery.QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    });
    const store = toolkit.configureStore({
        ...defaultTestStoreConfig(),
        ...storeConfig
    });
    const allPermissions = typeof permissions === 'function' ? permissions(DEFAULT_PERMISSIONS) : [
        ...DEFAULT_PERMISSIONS,
        ...permissions
    ];
    const router = reactRouterDom.createMemoryRouter([
        {
            path: '/*',
            element: /*#__PURE__*/ jsxRuntime.jsx(StrapiApp.StrapiAppProvider, {
                components: {},
                rbac: new rbac.RBAC(),
                widgets: {
                    widgets: [],
                    getAll: jest.fn(),
                    register: jest.fn()
                },
                customFields: {
                    customFields: {},
                    get: jest.fn().mockReturnValue({
                        name: 'color',
                        pluginId: 'mycustomfields',
                        type: 'text',
                        icon: jest.fn(),
                        intlLabel: {
                            id: 'mycustomfields.color.label',
                            defaultMessage: 'Color'
                        },
                        intlDescription: {
                            id: 'mycustomfields.color.description',
                            defaultMessage: 'Select any color'
                        },
                        components: {
                            Input: jest.fn().mockResolvedValue({
                                default: jest.fn()
                            })
                        }
                    }),
                    getAll: jest.fn(),
                    register: jest.fn()
                },
                fields: {},
                menu: [],
                getAdminInjectedComponents: jest.fn(),
                getPlugin: jest.fn(),
                plugins: {},
                runHookParallel: jest.fn(),
                runHookWaterfall: jest.fn().mockImplementation((_name, initialValue)=>initialValue),
                runHookSeries: jest.fn(),
                settings: {},
                children: /*#__PURE__*/ jsxRuntime.jsx(reactRedux.Provider, {
                    store: store,
                    children: /*#__PURE__*/ jsxRuntime.jsx(Auth.AuthProvider, {
                        _defaultPermissions: allPermissions,
                        _disableRenewToken: true,
                        children: /*#__PURE__*/ jsxRuntime.jsx(reactQuery.QueryClientProvider, {
                            client: queryClient,
                            children: /*#__PURE__*/ jsxRuntime.jsx(reactDnd.DndProvider, {
                                backend: reactDndHtml5Backend.HTML5Backend,
                                children: /*#__PURE__*/ jsxRuntime.jsx(LanguageProvider.LanguageProvider, {
                                    messages: {},
                                    children: /*#__PURE__*/ jsxRuntime.jsx(Theme.Theme, {
                                        themes: {
                                            dark: designSystem.darkTheme,
                                            light: designSystem.lightTheme
                                        },
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Notifications.NotificationsProvider, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(Context.GuidedTourContext, {
                                                enabled: false,
                                                children: /*#__PURE__*/ jsxRuntime.jsx(Configuration._internalConfigurationContextProvider, {
                                                    showReleaseNotification: false,
                                                    logos: {
                                                        auth: {
                                                            default: 'default'
                                                        },
                                                        menu: {
                                                            default: 'default'
                                                        }
                                                    },
                                                    updateProjectSettings: jest.fn(),
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(AppInfo.AppInfoProvider, {
                                                        autoReload: true,
                                                        useYarn: true,
                                                        dependencies: {
                                                            '@strapi/plugin-documentation': '4.2.0',
                                                            '@strapi/provider-upload-cloudinary': '4.2.0'
                                                        },
                                                        strapiVersion: "4.1.0",
                                                        communityEdition: true,
                                                        shouldUpdateStrapi: false,
                                                        children: children
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        }
    ], {
        initialEntries
    });
    // en is the default locale of the admin app.
    return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.RouterProvider, {
        router: router
    });
};
// eslint-disable-next-line react/jsx-no-useless-fragment
const fallbackWrapper = ({ children })=>/*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: children
    });
/**
 * @alpha
 * @description A custom render function that wraps the component with the necessary providers,
 * for use of testing components within the Strapi Admin.
 */ const render = (ui, { renderOptions, userEventOptions, initialEntries, providerOptions } = {})=>{
    const { wrapper: Wrapper = fallbackWrapper, ...restOptions } = renderOptions ?? {};
    return {
        ...react.render(ui, {
            wrapper: ({ children })=>/*#__PURE__*/ jsxRuntime.jsx(Providers, {
                    initialEntries: initialEntries,
                    ...providerOptions,
                    children: /*#__PURE__*/ jsxRuntime.jsx(Wrapper, {
                        children: children
                    })
                }),
            ...restOptions
        }),
        user: userEvent.userEvent.setup({
            skipHover: true,
            ...userEventOptions
        })
    };
};
/**
 * @alpha
 * @description A custom render-hook function that wraps the component with the necessary providers,
 * for use of testing hooks within the Strapi Admin.
 */ const renderHook = (hook, options)=>{
    const { wrapper: Wrapper = fallbackWrapper, initialEntries, providerOptions, ...restOptions } = options ?? {};
    return react.renderHook(hook, {
        wrapper: ({ children })=>/*#__PURE__*/ jsxRuntime.jsx(Providers, {
                initialEntries: initialEntries,
                ...providerOptions,
                children: /*#__PURE__*/ jsxRuntime.jsx(Wrapper, {
                    children: children
                })
            }),
        ...restOptions
    });
};

Object.defineProperty(exports, "act", {
  enumerable: true,
  get: function () { return react.act; }
});
Object.defineProperty(exports, "fireEvent", {
  enumerable: true,
  get: function () { return react.fireEvent; }
});
Object.defineProperty(exports, "screen", {
  enumerable: true,
  get: function () { return react.screen; }
});
Object.defineProperty(exports, "waitFor", {
  enumerable: true,
  get: function () { return react.waitFor; }
});
exports.server = server.server;
exports.defaultTestStoreConfig = defaultTestStoreConfig;
exports.render = render;
exports.renderHook = renderHook;
//# sourceMappingURL=utils.js.map
