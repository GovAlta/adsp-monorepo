const ROUTES_CE = [
    {
        lazy: async ()=>{
            const { ProtectedListPage } = await import('./pages/Roles/ListPage.mjs');
            return {
                Component: ProtectedListPage
            };
        },
        path: 'roles'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreatePage } = await import('./pages/Roles/CreatePage.mjs');
            return {
                Component: ProtectedCreatePage
            };
        },
        path: 'roles/duplicate/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreatePage } = await import('./pages/Roles/CreatePage.mjs');
            return {
                Component: ProtectedCreatePage
            };
        },
        path: 'roles/new'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditPage } = await import('./pages/Roles/EditPage.mjs');
            return {
                Component: ProtectedEditPage
            };
        },
        path: 'roles/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedListPage } = await import('./pages/Users/ListPage.mjs');
            return {
                Component: ProtectedListPage
            };
        },
        path: 'users'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditPage } = await import('./pages/Users/EditPage.mjs');
            return {
                Component: ProtectedEditPage
            };
        },
        path: 'users/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreatePage } = await import('./pages/Webhooks/CreatePage.mjs');
            return {
                Component: ProtectedCreatePage
            };
        },
        path: 'webhooks/create'
    },
    {
        lazy: async ()=>{
            const editWebhook = await import('./pages/Webhooks/EditPage.mjs');
            return {
                Component: editWebhook.ProtectedEditPage
            };
        },
        path: 'webhooks/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedListPage } = await import('./pages/Webhooks/ListPage.mjs');
            return {
                Component: ProtectedListPage
            };
        },
        path: 'webhooks'
    },
    {
        lazy: async ()=>{
            const { ProtectedListView } = await import('./pages/ApiTokens/ListView.mjs');
            return {
                Component: ProtectedListView
            };
        },
        path: 'api-tokens'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreateView } = await import('./pages/ApiTokens/CreateView.mjs');
            return {
                Component: ProtectedCreateView
            };
        },
        path: 'api-tokens/create'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditView } = await import('./pages/ApiTokens/EditView/EditViewPage.mjs');
            return {
                Component: ProtectedEditView
            };
        },
        path: 'api-tokens/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreateView } = await import('./pages/TransferTokens/CreateView.mjs');
            return {
                Component: ProtectedCreateView
            };
        },
        path: 'transfer-tokens/create'
    },
    {
        lazy: async ()=>{
            const { ProtectedListView } = await import('./pages/TransferTokens/ListView.mjs');
            return {
                Component: ProtectedListView
            };
        },
        path: 'transfer-tokens'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditView } = await import('./pages/TransferTokens/EditView.mjs');
            return {
                Component: ProtectedEditView
            };
        },
        path: 'transfer-tokens/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedInstalledPlugins } = await import('./pages/InstalledPlugins.mjs');
            return {
                Component: ProtectedInstalledPlugins
            };
        },
        path: 'list-plugins'
    },
    {
        lazy: async ()=>{
            const { PurchaseAuditLogs } = await import('./pages/PurchaseAuditLogs.mjs');
            return {
                Component: PurchaseAuditLogs
            };
        },
        path: 'purchase-audit-logs'
    },
    {
        lazy: async ()=>{
            const { PurchaseSingleSignOn } = await import('./pages/PurchaseSingleSignOn.mjs');
            return {
                Component: PurchaseSingleSignOn
            };
        },
        path: 'purchase-single-sign-on'
    },
    {
        lazy: async ()=>{
            const { PurchaseContentHistory } = await import('./pages/PurchaseContentHistory.mjs');
            return {
                Component: PurchaseContentHistory
            };
        },
        path: 'purchase-content-history'
    }
];

export { ROUTES_CE };
//# sourceMappingURL=constants.mjs.map
