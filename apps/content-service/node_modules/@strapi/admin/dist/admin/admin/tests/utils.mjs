import { jsx, Fragment } from 'react/jsx-runtime';
import 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fixtures } from '@strapi/admin-test-utils';
import { darkTheme, lightTheme } from '@strapi/design-system';
import { render as render$1, renderHook as renderHook$1 } from '@testing-library/react';
export { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { setLogger, QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { GuidedTourContext } from '../src/components/GuidedTour/Context.mjs';
import { LanguageProvider } from '../src/components/LanguageProvider.mjs';
import { Theme } from '../src/components/Theme.mjs';
import { RBAC } from '../src/core/apis/rbac.mjs';
import { AppInfoProvider } from '../src/features/AppInfo.mjs';
import { AuthProvider } from '../src/features/Auth.mjs';
import { _internalConfigurationContextProvider as ConfigurationContextProvider } from '../src/features/Configuration.mjs';
import { NotificationsProvider } from '../src/features/Notifications.mjs';
import { StrapiAppProvider } from '../src/features/StrapiApp.mjs';
import { reducer } from '../src/reducer.mjs';
import { adminApi } from '../src/services/api.mjs';
export { server } from './server.mjs';
import { initialState } from './store.mjs';

setLogger({
    log: ()=>{},
    warn: ()=>{},
    error: ()=>{}
});
const defaultTestStoreConfig = ()=>({
        preloadedState: initialState(),
        reducer: {
            [adminApi.reducerPath]: adminApi.reducer,
            admin_app: reducer
        },
        // @ts-expect-error – this fails.
        middleware: (getDefaultMiddleware)=>[
                ...getDefaultMiddleware({
                    // Disable timing checks for test env
                    immutableCheck: false,
                    serializableCheck: false
                }),
                adminApi.middleware
            ]
    });
const DEFAULT_PERMISSIONS = [
    ...fixtures.permissions.allPermissions,
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
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    });
    const store = configureStore({
        ...defaultTestStoreConfig(),
        ...storeConfig
    });
    const allPermissions = typeof permissions === 'function' ? permissions(DEFAULT_PERMISSIONS) : [
        ...DEFAULT_PERMISSIONS,
        ...permissions
    ];
    const router = createMemoryRouter([
        {
            path: '/*',
            element: /*#__PURE__*/ jsx(StrapiAppProvider, {
                components: {},
                rbac: new RBAC(),
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
                children: /*#__PURE__*/ jsx(Provider, {
                    store: store,
                    children: /*#__PURE__*/ jsx(AuthProvider, {
                        _defaultPermissions: allPermissions,
                        _disableRenewToken: true,
                        children: /*#__PURE__*/ jsx(QueryClientProvider, {
                            client: queryClient,
                            children: /*#__PURE__*/ jsx(DndProvider, {
                                backend: HTML5Backend,
                                children: /*#__PURE__*/ jsx(LanguageProvider, {
                                    messages: {},
                                    children: /*#__PURE__*/ jsx(Theme, {
                                        themes: {
                                            dark: darkTheme,
                                            light: lightTheme
                                        },
                                        children: /*#__PURE__*/ jsx(NotificationsProvider, {
                                            children: /*#__PURE__*/ jsx(GuidedTourContext, {
                                                enabled: false,
                                                children: /*#__PURE__*/ jsx(ConfigurationContextProvider, {
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
                                                    children: /*#__PURE__*/ jsx(AppInfoProvider, {
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
    return /*#__PURE__*/ jsx(RouterProvider, {
        router: router
    });
};
// eslint-disable-next-line react/jsx-no-useless-fragment
const fallbackWrapper = ({ children })=>/*#__PURE__*/ jsx(Fragment, {
        children: children
    });
/**
 * @alpha
 * @description A custom render function that wraps the component with the necessary providers,
 * for use of testing components within the Strapi Admin.
 */ const render = (ui, { renderOptions, userEventOptions, initialEntries, providerOptions } = {})=>{
    const { wrapper: Wrapper = fallbackWrapper, ...restOptions } = renderOptions ?? {};
    return {
        ...render$1(ui, {
            wrapper: ({ children })=>/*#__PURE__*/ jsx(Providers, {
                    initialEntries: initialEntries,
                    ...providerOptions,
                    children: /*#__PURE__*/ jsx(Wrapper, {
                        children: children
                    })
                }),
            ...restOptions
        }),
        user: userEvent.setup({
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
    return renderHook$1(hook, {
        wrapper: ({ children })=>/*#__PURE__*/ jsx(Providers, {
                initialEntries: initialEntries,
                ...providerOptions,
                children: /*#__PURE__*/ jsx(Wrapper, {
                    children: children
                })
            }),
        ...restOptions
    });
};

export { defaultTestStoreConfig, render, renderHook };
//# sourceMappingURL=utils.mjs.map
