import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalNotifications } from '../../ee/admin/src/components/GlobalNotifications.mjs';
import { Page } from './components/PageHelpers.mjs';
import { Providers } from './components/Providers.mjs';
import { LANGUAGE_LOCAL_STORAGE_KEY } from './reducer.mjs';

const App = ({ strapi, store })=>{
    useEffect(()=>{
        const language = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) || 'en';
        if (language) {
            document.documentElement.lang = language;
        }
    }, []);
    return /*#__PURE__*/ jsx(Providers, {
        strapi: strapi,
        store: store,
        children: /*#__PURE__*/ jsxs(Suspense, {
            fallback: /*#__PURE__*/ jsx(Page.Loading, {}),
            children: [
                /*#__PURE__*/ jsx(GlobalNotifications, {}),
                /*#__PURE__*/ jsx(Outlet, {})
            ]
        })
    });
};

export { App };
//# sourceMappingURL=App.mjs.map
