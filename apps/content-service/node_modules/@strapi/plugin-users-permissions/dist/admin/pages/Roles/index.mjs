import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Page } from '@strapi/strapi/admin';
import { Routes, Route } from 'react-router-dom';
import { PERMISSIONS } from '../../constants.mjs';
import { ProtectedRolesCreatePage } from './pages/CreatePage.mjs';
import { ProtectedRolesEditPage } from './pages/EditPage.mjs';
import { ProtectedRolesListPage } from './pages/ListPage/index.mjs';

const Roles = ()=>{
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.accessRoles,
        children: /*#__PURE__*/ jsxs(Routes, {
            children: [
                /*#__PURE__*/ jsx(Route, {
                    index: true,
                    element: /*#__PURE__*/ jsx(ProtectedRolesListPage, {})
                }),
                /*#__PURE__*/ jsx(Route, {
                    path: "new",
                    element: /*#__PURE__*/ jsx(ProtectedRolesCreatePage, {})
                }),
                /*#__PURE__*/ jsx(Route, {
                    path: ":id",
                    element: /*#__PURE__*/ jsx(ProtectedRolesEditPage, {})
                })
            ]
        })
    });
};

export { Roles as default };
//# sourceMappingURL=index.mjs.map
