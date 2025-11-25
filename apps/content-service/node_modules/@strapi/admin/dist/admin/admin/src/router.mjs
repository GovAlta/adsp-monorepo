import { jsx } from 'react/jsx-runtime';
import { getEERoutes as getEERoutes$1 } from '../../ee/admin/src/constants.mjs';
import { getEERoutes } from '../../ee/admin/src/pages/SettingsPage/constants.mjs';
import { AuthPage } from './pages/Auth/AuthPage.mjs';
import { ROUTES_CE } from './pages/Settings/constants.mjs';

/**
 * These are routes we don't want to be able to be changed by plugins.
 */ const getImmutableRoutes = ()=>[
        {
            path: 'usecase',
            lazy: async ()=>{
                const { PrivateUseCasePage } = await import('./pages/UseCasePage.mjs');
                return {
                    Component: PrivateUseCasePage
                };
            }
        },
        // this needs to go before auth/:authType because otherwise it won't match the route
        ...getEERoutes$1(),
        {
            path: 'auth/:authType',
            element: /*#__PURE__*/ jsx(AuthPage, {})
        }
    ];
const getInitialRoutes = ()=>[
        {
            index: true,
            lazy: async ()=>{
                const { HomePage } = await import('./pages/Home/HomePage.mjs');
                return {
                    Component: HomePage
                };
            }
        },
        {
            path: 'me',
            lazy: async ()=>{
                const { ProfilePage } = await import('./pages/ProfilePage.mjs');
                return {
                    Component: ProfilePage
                };
            }
        },
        {
            path: 'marketplace',
            lazy: async ()=>{
                const { ProtectedMarketplacePage } = await import('./pages/Marketplace/MarketplacePage.mjs');
                return {
                    Component: ProtectedMarketplacePage
                };
            }
        },
        {
            path: 'settings/*',
            lazy: async ()=>{
                const { Layout } = await import('./pages/Settings/Layout.mjs');
                return {
                    Component: Layout
                };
            },
            children: [
                {
                    path: 'application-infos',
                    lazy: async ()=>{
                        const { ApplicationInfoPage } = await import('./pages/Settings/pages/ApplicationInfo/ApplicationInfoPage.mjs');
                        return {
                            Component: ApplicationInfoPage
                        };
                    }
                },
                // ...Object.values(this.settings).flatMap(({ links }) =>
                //   links.map(({ to, Component }) => ({
                //     path: `${to}/*`,
                //     element: (
                //       <React.Suspense fallback={<Page.Loading />}>
                //         <Component />
                //       </React.Suspense>
                //     ),
                //   }))
                // ),
                ...[
                    ...getEERoutes(),
                    ...ROUTES_CE
                ].filter((route, index, refArray)=>refArray.findIndex((obj)=>obj.path === route.path) === index)
            ]
        }
    ];

export { getImmutableRoutes, getInitialRoutes };
//# sourceMappingURL=router.mjs.map
