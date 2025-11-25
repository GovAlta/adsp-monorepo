'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactRouterDom = require('react-router-dom');
var constants = require('../constants.js');
var ReleaseDetailsPage = require('./ReleaseDetailsPage.js');
var ReleasesPage = require('./ReleasesPage.js');

const App = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Protect, {
        permissions: constants.PERMISSIONS.main,
        children: /*#__PURE__*/ jsxRuntime.jsxs(reactRouterDom.Routes, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                    index: true,
                    element: /*#__PURE__*/ jsxRuntime.jsx(ReleasesPage.ReleasesPage, {})
                }),
                /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                    path: ':releaseId',
                    element: /*#__PURE__*/ jsxRuntime.jsx(ReleaseDetailsPage.ReleaseDetailsPage, {})
                })
            ]
        })
    });
};

exports.App = App;
//# sourceMappingURL=App.js.map
