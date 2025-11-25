'use strict';

var jsxRuntime = require('react/jsx-runtime');
var constants$2 = require('../../ee/admin/src/constants.js');
var constants = require('../../ee/admin/src/pages/SettingsPage/constants.js');
var AuthPage = require('./pages/Auth/AuthPage.js');
var constants$1 = require('./pages/Settings/constants.js');

/**
 * These are routes we don't want to be able to be changed by plugins.
 */ const getImmutableRoutes = ()=>[
        {
            path: 'usecase',
            lazy: async ()=>{
                const { PrivateUseCasePage } = await Promise.resolve().then(function () { return require('./pages/UseCasePage.js'); });
                return {
                    Component: PrivateUseCasePage
                };
            }
        },
        // this needs to go before auth/:authType because otherwise it won't match the route
        ...constants$2.getEERoutes(),
        {
            path: 'auth/:authType',
            element: /*#__PURE__*/ jsxRuntime.jsx(AuthPage.AuthPage, {})
        }
    ];
const getInitialRoutes = ()=>[
        {
            index: true,
            lazy: async ()=>{
                const { HomePage } = await Promise.resolve().then(function () { return require('./pages/Home/HomePage.js'); });
                return {
                    Component: HomePage
                };
            }
        },
        {
            path: 'me',
            lazy: async ()=>{
                const { ProfilePage } = await Promise.resolve().then(function () { return require('./pages/ProfilePage.js'); });
                return {
                    Component: ProfilePage
                };
            }
        },
        {
            path: 'marketplace',
            lazy: async ()=>{
                const { ProtectedMarketplacePage } = await Promise.resolve().then(function () { return require('./pages/Marketplace/MarketplacePage.js'); });
                return {
                    Component: ProtectedMarketplacePage
                };
            }
        },
        {
            path: 'settings/*',
            lazy: async ()=>{
                const { Layout } = await Promise.resolve().then(function () { return require('./pages/Settings/Layout.js'); });
                return {
                    Component: Layout
                };
            },
            children: [
                {
                    path: 'application-infos',
                    lazy: async ()=>{
                        const { ApplicationInfoPage } = await Promise.resolve().then(function () { return require('./pages/Settings/pages/ApplicationInfo/ApplicationInfoPage.js'); });
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
                    ...constants.getEERoutes(),
                    ...constants$1.ROUTES_CE
                ].filter((route, index, refArray)=>refArray.findIndex((obj)=>obj.path === route.path) === index)
            ]
        }
    ];

exports.getImmutableRoutes = getImmutableRoutes;
exports.getInitialRoutes = getInitialRoutes;
//# sourceMappingURL=router.js.map
