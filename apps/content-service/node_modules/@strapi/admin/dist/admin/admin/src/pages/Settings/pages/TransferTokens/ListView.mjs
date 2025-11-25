import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { LinkButton, EmptyStateLayout } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import * as qs from 'qs';
import { useIntl } from 'react-intl';
import { useNavigate, Link } from 'react-router-dom';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useTracking } from '../../../../features/Tracking.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useOnce } from '../../../../hooks/useOnce.mjs';
import { useRBAC } from '../../../../hooks/useRBAC.mjs';
import { useGetTransferTokensQuery, useDeleteTransferTokenMutation } from '../../../../services/transferTokens.mjs';
import { TRANSFER_TOKEN_TYPE } from '../../components/Tokens/constants.mjs';
import { Table } from '../../components/Tokens/Table.mjs';

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
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens']);
    const { isLoading: isLoadingRBAC, allowedActions: { canCreate, canDelete, canUpdate, canRead } } = useRBAC(permissions);
    const navigate = useNavigate();
    const { trackUsage } = useTracking();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    React.useEffect(()=>{
        navigate({
            search: qs.stringify({
                sort: 'name:ASC'
            }, {
                encode: false
            })
        });
    }, [
        navigate
    ]);
    useOnce(()=>{
        trackUsage('willAccessTokenList', {
            tokenType: TRANSFER_TOKEN_TYPE
        });
    });
    const headers = tableHeaders.map((header)=>({
            ...header,
            label: formatMessage(header.label)
        }));
    const { data: transferTokens = [], isLoading: isLoadingTokens, error } = useGetTransferTokensQuery(undefined, {
        skip: !canRead
    });
    React.useEffect(()=>{
        if (transferTokens) {
            trackUsage('didAccessTokenList', {
                number: transferTokens.length,
                tokenType: TRANSFER_TOKEN_TYPE
            });
        }
    }, [
        trackUsage,
        transferTokens
    ]);
    React.useEffect(()=>{
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
    const [deleteToken] = useDeleteTransferTokenMutation();
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
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Transfer Tokens'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Header, {
                title: formatMessage({
                    id: 'Settings.transferTokens.title',
                    defaultMessage: 'Transfer Tokens'
                }),
                subtitle: formatMessage({
                    id: 'Settings.transferTokens.description',
                    defaultMessage: '"List of generated transfer tokens"'
                }),
                primaryAction: canCreate ? /*#__PURE__*/ jsx(LinkButton, {
                    role: "button",
                    tag: Link,
                    "data-testid": "create-transfer-token-button",
                    startIcon: /*#__PURE__*/ jsx(Plus, {}),
                    size: "S",
                    onClick: ()=>trackUsage('willAddTokenFromList', {
                            tokenType: TRANSFER_TOKEN_TYPE
                        }),
                    to: "/settings/transfer-tokens/create",
                    children: formatMessage({
                        id: 'Settings.transferTokens.create',
                        defaultMessage: 'Create new Transfer Token'
                    })
                }) : undefined
            }),
            !canRead ? /*#__PURE__*/ jsx(Page.NoPermissions, {}) : /*#__PURE__*/ jsx(Page.Main, {
                "aria-busy": isLoading,
                children: /*#__PURE__*/ jsxs(Layouts.Content, {
                    children: [
                        transferTokens.length > 0 && /*#__PURE__*/ jsx(Table, {
                            permissions: {
                                canRead,
                                canDelete,
                                canUpdate
                            },
                            headers: headers,
                            isLoading: isLoading,
                            onConfirmDelete: handleDelete,
                            tokens: transferTokens,
                            tokenType: TRANSFER_TOKEN_TYPE
                        }),
                        canCreate && transferTokens.length === 0 ? /*#__PURE__*/ jsx(EmptyStateLayout, {
                            action: /*#__PURE__*/ jsx(LinkButton, {
                                tag: Link,
                                variant: "secondary",
                                startIcon: /*#__PURE__*/ jsx(Plus, {}),
                                to: "/settings/transfer-tokens/create",
                                children: formatMessage({
                                    id: 'Settings.transferTokens.addNewToken',
                                    defaultMessage: 'Add new Transfer Token'
                                })
                            }),
                            icon: /*#__PURE__*/ jsx(EmptyDocuments, {
                                width: "16rem"
                            }),
                            content: formatMessage({
                                id: 'Settings.transferTokens.addFirstToken',
                                defaultMessage: 'Add your first Transfer Token'
                            })
                        }) : null,
                        !canCreate && transferTokens.length === 0 ? /*#__PURE__*/ jsx(EmptyStateLayout, {
                            icon: /*#__PURE__*/ jsx(EmptyDocuments, {
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
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens'].main);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(ListView, {})
    });
};

export { ListView, ProtectedListView };
//# sourceMappingURL=ListView.mjs.map
