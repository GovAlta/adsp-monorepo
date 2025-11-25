'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var reactRouterDom = require('react-router-dom');
var collections = require('./constants/collections.js');
var routes$1 = require('./history/routes.js');
var routes$2 = require('./preview/routes.js');

const ProtectedEditViewPage = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./pages/EditView/EditViewPage.js'); }).then((mod)=>({
            default: mod.ProtectedEditViewPage
        })));
const ProtectedListViewPage = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./pages/ListView/ListViewPage.js'); }).then((mod)=>({
            default: mod.ProtectedListViewPage
        })));
const ProtectedListConfiguration = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./pages/ListConfiguration/ListConfigurationPage.js'); }).then((mod)=>({
            default: mod.ProtectedListConfiguration
        })));
const ProtectedEditConfigurationPage = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./pages/EditConfigurationPage.js'); }).then((mod)=>({
            default: mod.ProtectedEditConfigurationPage
        })));
const ProtectedComponentConfigurationPage = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./pages/ComponentConfigurationPage.js'); }).then((mod)=>({
            default: mod.ProtectedComponentConfigurationPage
        })));
const NoPermissions = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./pages/NoPermissionsPage.js'); }).then((mod)=>({
            default: mod.NoPermissions
        })));
const NoContentType = /*#__PURE__*/ React.lazy(()=>Promise.resolve().then(function () { return require('./pages/NoContentTypePage.js'); }).then((mod)=>({
            default: mod.NoContentType
        })));
const CollectionTypePages = ()=>{
    const { collectionType } = reactRouterDom.useParams();
    /**
   * We only support two types of collections.
   */ if (collectionType !== collections.COLLECTION_TYPES && collectionType !== collections.SINGLE_TYPES) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/404"
        });
    }
    return collectionType === collections.COLLECTION_TYPES ? /*#__PURE__*/ jsxRuntime.jsx(ProtectedListViewPage, {}) : /*#__PURE__*/ jsxRuntime.jsx(ProtectedEditViewPage, {});
};
const CLONE_RELATIVE_PATH = ':collectionType/:slug/clone/:origin';
const CLONE_PATH = `/content-manager/${CLONE_RELATIVE_PATH}`;
const LIST_RELATIVE_PATH = ':collectionType/:slug';
const LIST_PATH = `/content-manager/collection-types/:slug`;
const routes = [
    {
        path: LIST_RELATIVE_PATH,
        element: /*#__PURE__*/ jsxRuntime.jsx(CollectionTypePages, {})
    },
    {
        path: ':collectionType/:slug/:id',
        Component: ProtectedEditViewPage
    },
    {
        path: CLONE_RELATIVE_PATH,
        Component: ProtectedEditViewPage
    },
    {
        path: ':collectionType/:slug/configurations/list',
        Component: ProtectedListConfiguration
    },
    {
        path: 'components/:slug/configurations/edit',
        Component: ProtectedComponentConfigurationPage
    },
    {
        path: ':collectionType/:slug/configurations/edit',
        Component: ProtectedEditConfigurationPage
    },
    {
        path: '403',
        Component: NoPermissions
    },
    {
        path: 'no-content-types',
        Component: NoContentType
    },
    ...routes$1.routes,
    ...routes$2.routes
];

exports.CLONE_PATH = CLONE_PATH;
exports.LIST_PATH = LIST_PATH;
exports.routes = routes;
//# sourceMappingURL=router.js.map
