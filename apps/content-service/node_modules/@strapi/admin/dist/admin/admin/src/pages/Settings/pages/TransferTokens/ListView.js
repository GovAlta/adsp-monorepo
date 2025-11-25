'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var Notifications = require('../../../../features/Notifications.js');
var Tracking = require('../../../../features/Tracking.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var useOnce = require('../../../../hooks/useOnce.js');
var useRBAC = require('../../../../hooks/useRBAC.js');
var transferTokens = require('../../../../services/transferTokens.js');
var constants = require('../../components/Tokens/constants.js');
var Table = require('../../components/Tokens/Table.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);
var qs__namespace = /*#__PURE__*/_interopNamespaceDefault(qs);

const tableHeaders = [
    {
        name: 'name',
        label: {
            id: 'Settings.tokens.ListView.headers.name',
            defaultMessage: 'Name'
        },
        sortable: true
    },
    {
        name: 'description',
        label: {
            id: 'Settings.tokens.ListView.headers.description',
            defaultMessage: 'Description'
        },
        sortable: false
    },
    {
        name: 'createdAt',
        label: {
            id: 'Settings.tokens.ListView.headers.createdAt',
            defaultMessage: 'Created at'
        },
        sortable: false
    },
    {
        name: 'lastUsedAt',
        label: {
            id: 'Settings.tokens.ListView.headers.lastUsedAt',
            defaultMessage: 'Last used'
        },
        sortable: false
    }
];
/* -------------------------------------------------------------------------------------------------
 * ListView
 * -----------------------------------------------------------------------------------------------*/ const ListView = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens']);
    const { isLoading: isLoadingRBAC, allowedActions: { canCreate, canDelete, canUpdate, canRead } } = useRBAC.useRBAC(permissions);
    const navigate = reactRouterDom.useNavigate();
    const { trackUsage } = Tracking.useTracking();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    React__namespace.useEffect(()=>{
        navigate({
            search: qs__namespace.stringify({
                sort: 'name:ASC'
            }, {
                encode: false
            })
        });
    }, [
        navigate
    ]);
    useOnce.useOnce(()=>{
        trackUsage('willAccessTokenList', {
            tokenType: constants.TRANSFER_TOKEN_TYPE
        });
    });
    const headers = tableHeaders.map((header)=>({
            ...header,
            label: formatMessage(header.label)
        }));
    const { data: transferTokens$1 = [], isLoading: isLoadingTokens, error } = transferTokens.useGetTransferTokensQuery(undefined, {
        skip: !canRead
    });
    React__namespace.useEffect(()=>{
        if (transferTokens$1) {
            trackUsage('didAccessTokenList', {
                number: transferTokens$1.length,
                tokenType: constants.TRANSFER_TOKEN_TYPE
            });
        }
    }, [
        trackUsage,
        transferTokens$1
    ]);
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        error,
        formatAPIError,
        toggleNotification
    ]);
    const [deleteToken] = transferTokens.useDeleteTransferTokenMutation();
    const handleDelete = async (id)=>{
        try {
            const res = await deleteToken(id);
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
            }
        } catch  {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occured'
                })
            });
        }
    };
    const isLoading = isLoadingTokens || isLoadingRBAC;
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Transfer Tokens'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                title: formatMessage({
                    id: 'Settings.transferTokens.title',
                    defaultMessage: 'Transfer Tokens'
                }),
                subtitle: formatMessage({
                    id: 'Settings.transferTokens.description',
                    defaultMessage: '"List of generated transfer tokens"'
                }),
                primaryAction: canCreate ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                    role: "button",
                    tag: reactRouterDom.Link,
                    "data-testid": "create-transfer-token-button",
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                    size: "S",
                    onClick: ()=>trackUsage('willAddTokenFromList', {
                            tokenType: constants.TRANSFER_TOKEN_TYPE
                        }),
                    to: "/settings/transfer-tokens/create",
                    children: formatMessage({
                        id: 'Settings.transferTokens.create',
                        defaultMessage: 'Create new Transfer Token'
                    })
                }) : undefined
            }),
            !canRead ? /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.NoPermissions, {}) : /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Main, {
                "aria-busy": isLoading,
                children: /*#__PURE__*/ jsxRuntime.jsxs(Layout.Layouts.Content, {
                    children: [
                        transferTokens$1.length > 0 && /*#__PURE__*/ jsxRuntime.jsx(Table.Table, {
                            permissions: {
                                canRead,
                                canDelete,
                                canUpdate
                            },
                            headers: headers,
                            isLoading: isLoading,
                            onConfirmDelete: handleDelete,
                            tokens: transferTokens$1,
                            tokenType: constants.TRANSFER_TOKEN_TYPE
                        }),
                        canCreate && transferTokens$1.length === 0 ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
                            action: /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                                tag: reactRouterDom.Link,
                                variant: "secondary",
                                startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                                to: "/settings/transfer-tokens/create",
                                children: formatMessage({
                                    id: 'Settings.transferTokens.addNewToken',
                                    defaultMessage: 'Add new Transfer Token'
                                })
                            }),
                            icon: /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyDocuments, {
                                width: "16rem"
                            }),
                            content: formatMessage({
                                id: 'Settings.transferTokens.addFirstToken',
                                defaultMessage: 'Add your first Transfer Token'
                            })
                        }) : null,
                        !canCreate && transferTokens$1.length === 0 ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
                            icon: /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyDocuments, {
                                width: "16rem"
                            }),
                            content: formatMessage({
                                id: 'Settings.transferTokens.emptyStateLayout',
                                defaultMessage: 'You don’t have any content yet...'
                            })
                        }) : null
                    ]
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedListView
 * -----------------------------------------------------------------------------------------------*/ const ProtectedListView = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens'].main);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(ListView, {})
    });
};

exports.ListView = ListView;
exports.ProtectedListView = ProtectedListView;
//# sourceMappingURL=ListView.js.map
