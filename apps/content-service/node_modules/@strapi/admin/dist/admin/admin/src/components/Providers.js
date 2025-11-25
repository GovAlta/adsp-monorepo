'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var reactQuery = require('react-query');
var reactRedux = require('react-redux');
var Auth = require('../features/Auth.js');
var BackButton = require('../features/BackButton.js');
var Configuration = require('../features/Configuration.js');
var Notifications = require('../features/Notifications.js');
var StrapiApp = require('../features/StrapiApp.js');
var Tracking = require('../features/Tracking.js');
var GuidedTourProvider = require('./GuidedTour/GuidedTourProvider.js');
var LanguageProvider = require('./LanguageProvider.js');
var Theme = require('./Theme.js');

const queryClient = new reactQuery.QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});
const Providers = ({ children, strapi, store })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(StrapiApp.StrapiAppProvider, {
        components: strapi.library.components,
        customFields: strapi.customFields,
        widgets: strapi.widgets,
        fields: strapi.library.fields,
        menu: strapi.router.menu,
        getAdminInjectedComponents: strapi.getAdminInjectedComponents,
        getPlugin: strapi.getPlugin,
        plugins: strapi.plugins,
        rbac: strapi.rbac,
        runHookParallel: strapi.runHookParallel,
        runHookWaterfall: (name, initialValue)=>strapi.runHookWaterfall(name, initialValue, store),
        runHookSeries: strapi.runHookSeries,
        settings: strapi.router.settings,
        children: /*#__PURE__*/ jsxRuntime.jsx(reactRedux.Provider, {
            store: store,
            children: /*#__PURE__*/ jsxRuntime.jsx(reactQuery.QueryClientProvider, {
                client: queryClient,
                children: /*#__PURE__*/ jsxRuntime.jsx(Auth.AuthProvider, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(BackButton.HistoryProvider, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(LanguageProvider.LanguageProvider, {
                            messages: strapi.configurations.translations,
                            children: /*#__PURE__*/ jsxRuntime.jsx(Theme.Theme, {
                                themes: strapi.configurations.themes,
                                children: /*#__PURE__*/ jsxRuntime.jsx(Notifications.NotificationsProvider, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(Tracking.TrackingProvider, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(GuidedTourProvider.GuidedTourProvider, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(Configuration.ConfigurationProvider, {
                                                defaultAuthLogo: strapi.configurations.authLogo,
                                                defaultMenuLogo: strapi.configurations.menuLogo,
                                                showReleaseNotification: strapi.configurations.notifications.releases,
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
    });
};

exports.Providers = Providers;
//# sourceMappingURL=Providers.js.map
