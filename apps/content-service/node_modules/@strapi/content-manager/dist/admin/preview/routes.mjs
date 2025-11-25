import * as React from 'react';

const ProtectedPreviewPage = /*#__PURE__*/ React.lazy(()=>import('./pages/Preview.mjs').then((mod)=>({
            default: mod.ProtectedPreviewPage
        })));
const routes = [
    {
        path: ':collectionType/:slug/:id/preview',
        Component: ProtectedPreviewPage
    },
    {
        path: ':collectionType/:slug/preview',
        Component: ProtectedPreviewPage
    }
];

export { routes };
//# sourceMappingURL=routes.mjs.map
