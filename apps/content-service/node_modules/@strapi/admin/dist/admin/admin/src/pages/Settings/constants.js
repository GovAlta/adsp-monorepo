'use strict';

const ROUTES_CE = [
    {
        lazy: async ()=>{
            const { ProtectedListPage } = await Promise.resolve().then(function () { return require('./pages/Roles/ListPage.js'); });
            return {
                Component: ProtectedListPage
            };
        },
        path: 'roles'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreatePage } = await Promise.resolve().then(function () { return require('./pages/Roles/CreatePage.js'); });
            return {
                Component: ProtectedCreatePage
            };
        },
        path: 'roles/duplicate/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreatePage } = await Promise.resolve().then(function () { return require('./pages/Roles/CreatePage.js'); });
            return {
                Component: ProtectedCreatePage
            };
        },
        path: 'roles/new'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditPage } = await Promise.resolve().then(function () { return require('./pages/Roles/EditPage.js'); });
            return {
                Component: ProtectedEditPage
            };
        },
        path: 'roles/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedListPage } = await Promise.resolve().then(function () { return require('./pages/Users/ListPage.js'); });
            return {
                Component: ProtectedListPage
            };
        },
        path: 'users'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditPage } = await Promise.resolve().then(function () { return require('./pages/Users/EditPage.js'); });
            return {
                Component: ProtectedEditPage
            };
        },
        path: 'users/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreatePage } = await Promise.resolve().then(function () { return require('./pages/Webhooks/CreatePage.js'); });
            return {
                Component: ProtectedCreatePage
            };
        },
        path: 'webhooks/create'
    },
    {
        lazy: async ()=>{
            const editWebhook = await Promise.resolve().then(function () { return require('./pages/Webhooks/EditPage.js'); });
            return {
                Component: editWebhook.ProtectedEditPage
            };
        },
        path: 'webhooks/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedListPage } = await Promise.resolve().then(function () { return require('./pages/Webhooks/ListPage.js'); });
            return {
                Component: ProtectedListPage
            };
        },
        path: 'webhooks'
    },
    {
        lazy: async ()=>{
            const { ProtectedListView } = await Promise.resolve().then(function () { return require('./pages/ApiTokens/ListView.js'); });
            return {
                Component: ProtectedListView
            };
        },
        path: 'api-tokens'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreateView } = await Promise.resolve().then(function () { return require('./pages/ApiTokens/CreateView.js'); });
            return {
                Component: ProtectedCreateView
            };
        },
        path: 'api-tokens/create'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditView } = await Promise.resolve().then(function () { return require('./pages/ApiTokens/EditView/EditViewPage.js'); });
            return {
                Component: ProtectedEditView
            };
        },
        path: 'api-tokens/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedCreateView } = await Promise.resolve().then(function () { return require('./pages/TransferTokens/CreateView.js'); });
            return {
                Component: ProtectedCreateView
            };
        },
        path: 'transfer-tokens/create'
    },
    {
        lazy: async ()=>{
            const { ProtectedListView } = await Promise.resolve().then(function () { return require('./pages/TransferTokens/ListView.js'); });
            return {
                Component: ProtectedListView
            };
        },
        path: 'transfer-tokens'
    },
    {
        lazy: async ()=>{
            const { ProtectedEditView } = await Promise.resolve().then(function () { return require('./pages/TransferTokens/EditView.js'); });
            return {
                Component: ProtectedEditView
            };
        },
        path: 'transfer-tokens/:id'
    },
    {
        lazy: async ()=>{
            const { ProtectedInstalledPlugins } = await Promise.resolve().then(function () { return require('./pages/InstalledPlugins.js'); });
            return {
                Component: ProtectedInstalledPlugins
            };
        },
        path: 'list-plugins'
    },
    {
        lazy: async ()=>{
            const { PurchaseAuditLogs } = await Promise.resolve().then(function () { return require('./pages/PurchaseAuditLogs.js'); });
            return {
                Component: PurchaseAuditLogs
            };
        },
        path: 'purchase-audit-logs'
    },
    {
        lazy: async ()=>{
            const { PurchaseSingleSignOn } = await Promise.resolve().then(function () { return require('./pages/PurchaseSingleSignOn.js'); });
            return {
                Component: PurchaseSingleSignOn
            };
        },
        path: 'purchase-single-sign-on'
    },
    {
        lazy: async ()=>{
            const { PurchaseContentHistory } = await Promise.resolve().then(function () { return require('./pages/PurchaseContentHistory.js'); });
            return {
                Component: PurchaseContentHistory
            };
        },
        path: 'purchase-content-history'
    }
];

exports.ROUTES_CE = ROUTES_CE;
//# sourceMappingURL=constants.js.map
