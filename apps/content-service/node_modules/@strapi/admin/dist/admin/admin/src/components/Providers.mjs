import { jsx } from 'react/jsx-runtime';
import 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { AuthProvider } from '../features/Auth.mjs';
import { HistoryProvider } from '../features/BackButton.mjs';
import { ConfigurationProvider } from '../features/Configuration.mjs';
import { NotificationsProvider } from '../features/Notifications.mjs';
import { StrapiAppProvider } from '../features/StrapiApp.mjs';
import { TrackingProvider } from '../features/Tracking.mjs';
import { GuidedTourProvider } from './GuidedTour/GuidedTourProvider.mjs';
import { LanguageProvider } from './LanguageProvider.mjs';
import { Theme } from './Theme.mjs';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});
const Providers = ({ children, strapi, store })=>{
    return /*#__PURE__*/ jsx(StrapiAppProvider, {
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
        children: /*#__PURE__*/ jsx(Provider, {
            store: store,
            children: /*#__PURE__*/ jsx(QueryClientProvider, {
                client: queryClient,
                children: /*#__PURE__*/ jsx(AuthProvider, {
                    children: /*#__PURE__*/ jsx(HistoryProvider, {
                        children: /*#__PURE__*/ jsx(LanguageProvider, {
                            messages: strapi.configurations.translations,
                            children: /*#__PURE__*/ jsx(Theme, {
                                themes: strapi.configurations.themes,
                                children: /*#__PURE__*/ jsx(NotificationsProvider, {
                                    children: /*#__PURE__*/ jsx(TrackingProvider, {
                                        children: /*#__PURE__*/ jsx(GuidedTourProvider, {
                                            children: /*#__PURE__*/ jsx(ConfigurationProvider, {
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

export { Providers };
//# sourceMappingURL=Providers.mjs.map
