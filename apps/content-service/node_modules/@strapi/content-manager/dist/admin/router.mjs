import { jsx } from 'react/jsx-runtime';
import { lazy } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { COLLECTION_TYPES, SINGLE_TYPES } from './constants/collections.mjs';
import { routes as routes$1 } from './history/routes.mjs';
import { routes as routes$2 } from './preview/routes.mjs';

const ProtectedEditViewPage = /*#__PURE__*/ lazy(()=>import('./pages/EditView/EditViewPage.mjs').then((mod)=>({
            default: mod.ProtectedEditViewPage
        })));
const ProtectedListViewPage = /*#__PURE__*/ lazy(()=>import('./pages/ListView/ListViewPage.mjs').then((mod)=>({
            default: mod.ProtectedListViewPage
        })));
const ProtectedListConfiguration = /*#__PURE__*/ lazy(()=>import('./pages/ListConfiguration/ListConfigurationPage.mjs').then((mod)=>({
            default: mod.ProtectedListConfiguration
        })));
const ProtectedEditConfigurationPage = /*#__PURE__*/ lazy(()=>import('./pages/EditConfigurationPage.mjs').then((mod)=>({
            default: mod.ProtectedEditConfigurationPage
        })));
const ProtectedComponentConfigurationPage = /*#__PURE__*/ lazy(()=>import('./pages/ComponentConfigurationPage.mjs').then((mod)=>({
            default: mod.ProtectedComponentConfigurationPage
        })));
const NoPermissions = /*#__PURE__*/ lazy(()=>import('./pages/NoPermissionsPage.mjs').then((mod)=>({
            default: mod.NoPermissions
        })));
const NoContentType = /*#__PURE__*/ lazy(()=>import('./pages/NoContentTypePage.mjs').then((mod)=>({
            default: mod.NoContentType
        })));
const CollectionTypePages = ()=>{
    const { collectionType } = useParams();
    /**
   * We only support two types of collections.
   */ if (collectionType !== COLLECTION_TYPES && collectionType !== SINGLE_TYPES) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/404"
        });
    }
    return collectionType === COLLECTION_TYPES ? /*#__PURE__*/ jsx(ProtectedListViewPage, {}) : /*#__PURE__*/ jsx(ProtectedEditViewPage, {});
};
const CLONE_RELATIVE_PATH = ':collectionType/:slug/clone/:origin';
const CLONE_PATH = `/content-manager/${CLONE_RELATIVE_PATH}`;
const LIST_RELATIVE_PATH = ':collectionType/:slug';
const LIST_PATH = `/content-manager/collection-types/:slug`;
const routes = [
    {
        path: LIST_RELATIVE_PATH,
        element: /*#__PURE__*/ jsx(CollectionTypePages, {})
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
    ...routes$1,
    ...routes$2
];

export { CLONE_PATH, LIST_PATH, routes };
//# sourceMappingURL=router.mjs.map
