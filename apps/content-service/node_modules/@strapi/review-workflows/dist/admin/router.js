'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var reactRouterDom = require('react-router-dom');

const ProtectedListPage = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./routes/settings/index.js'); }).then((mod)=>({
            default: mod.ProtectedListPage
        })));
const ProtectedEditPage = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./routes/settings/id.js'); }).then((mod)=>({
            default: mod.ProtectedEditPage
        })));
const routes = [
    {
        path: '/',
        Component: ProtectedListPage
    },
    {
        path: ':id',
        Component: ProtectedEditPage
    }
];
const Router = ()=>/*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Routes, {
        children: routes.map((route)=>/*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                ...route
            }, route.path))
    });

exports.Router = Router;
//# sourceMappingURL=router.js.map
