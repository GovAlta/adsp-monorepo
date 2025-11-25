import * as React from 'react';

const ProtectedHistoryPage = /*#__PURE__*/ React.lazy(()=>import('./pages/History.mjs').then((mod)=>({
            default: mod.ProtectedHistoryPage
        })));
/**
 * These routes will be merged with the rest of the Content Manager routes
 */ const routes = [
    {
        path: ':collectionType/:slug/:id/history',
        Component: ProtectedHistoryPage
    },
    {
        path: ':collectionType/:slug/history',
        Component: ProtectedHistoryPage
    }
];

export { routes };
//# sourceMappingURL=routes.mjs.map
