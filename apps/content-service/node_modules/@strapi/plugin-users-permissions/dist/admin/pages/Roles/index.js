'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var admin = require('@strapi/strapi/admin');
var reactRouterDom = require('react-router-dom');
var constants = require('../../constants.js');
var CreatePage = require('./pages/CreatePage.js');
var EditPage = require('./pages/EditPage.js');
var index = require('./pages/ListPage/index.js');

const Roles = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Protect, {
        permissions: constants.PERMISSIONS.accessRoles,
        children: /*#__PURE__*/ jsxRuntime.jsxs(reactRouterDom.Routes, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                    index: true,
                    element: /*#__PURE__*/ jsxRuntime.jsx(index.ProtectedRolesListPage, {})
                }),
                /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                    path: "new",
                    element: /*#__PURE__*/ jsxRuntime.jsx(CreatePage.ProtectedRolesCreatePage, {})
                }),
                /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                    path: ":id",
                    element: /*#__PURE__*/ jsxRuntime.jsx(EditPage.ProtectedRolesEditPage, {})
                })
            ]
        })
    });
};

module.exports = Roles;
//# sourceMappingURL=index.js.map
