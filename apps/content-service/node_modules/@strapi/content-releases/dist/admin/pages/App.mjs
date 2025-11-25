import { jsx, jsxs } from 'react/jsx-runtime';
import { Page } from '@strapi/admin/strapi-admin';
import { Routes, Route } from 'react-router-dom';
import { PERMISSIONS } from '../constants.mjs';
import { ReleaseDetailsPage } from './ReleaseDetailsPage.mjs';
import { ReleasesPage } from './ReleasesPage.mjs';

const App = ()=>{
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.main,
        children: /*#__PURE__*/ jsxs(Routes, {
            children: [
                /*#__PURE__*/ jsx(Route, {
                    index: true,
                    element: /*#__PURE__*/ jsx(ReleasesPage, {})
                }),
                /*#__PURE__*/ jsx(Route, {
                    path: ':releaseId',
                    element: /*#__PURE__*/ jsx(ReleaseDetailsPage, {})
                })
            ]
        })
    });
};

export { App };
//# sourceMappingURL=App.mjs.map
