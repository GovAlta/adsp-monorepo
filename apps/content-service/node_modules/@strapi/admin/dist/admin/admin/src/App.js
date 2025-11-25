'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var reactRouterDom = require('react-router-dom');
var GlobalNotifications = require('../../ee/admin/src/components/GlobalNotifications.js');
var PageHelpers = require('./components/PageHelpers.js');
var Providers = require('./components/Providers.js');
var reducer = require('./reducer.js');

const App = ({ strapi, store })=>{
    React.useEffect(()=>{
        const language = localStorage.getItem(reducer.LANGUAGE_LOCAL_STORAGE_KEY) || 'en';
        if (language) {
            document.documentElement.lang = language;
        }
    }, []);
    return /*#__PURE__*/ jsxRuntime.jsx(Providers.Providers, {
        strapi: strapi,
        store: store,
        children: /*#__PURE__*/ jsxRuntime.jsxs(React.Suspense, {
            fallback: /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {}),
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(GlobalNotifications.GlobalNotifications, {}),
                /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Outlet, {})
            ]
        })
    });
};

exports.App = App;
//# sourceMappingURL=App.js.map
