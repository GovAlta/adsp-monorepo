import { jsx } from 'react/jsx-runtime';
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const ProtectedListPage = /*#__PURE__*/ lazy(()=>import('./routes/settings/index.mjs').then((mod)=>({
            default: mod.ProtectedListPage
        })));
const ProtectedEditPage = /*#__PURE__*/ lazy(()=>import('./routes/settings/id.mjs').then((mod)=>({
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
const Router = ()=>/*#__PURE__*/ jsx(Routes, {
        children: routes.map((route)=>/*#__PURE__*/ jsx(Route, {
                ...route
            }, route.path))
    });

export { Router };
//# sourceMappingURL=router.mjs.map
