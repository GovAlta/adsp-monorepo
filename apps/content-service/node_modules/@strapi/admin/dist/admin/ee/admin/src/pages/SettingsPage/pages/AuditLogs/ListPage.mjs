import { jsx, jsxs } from 'react/jsx-runtime';
import { Typography, Flex, IconButton } from '@strapi/design-system';
import { Eye } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Filters } from '../../../../../../../admin/src/components/Filters.mjs';
import { Layouts } from '../../../../../../../admin/src/components/Layouts/Layout.mjs';
import { Page } from '../../../../../../../admin/src/components/PageHelpers.mjs';
import { Pagination } from '../../../../../../../admin/src/components/Pagination.mjs';
import { Table } from '../../../../../../../admin/src/components/Table.mjs';
import { useTypedSelector } from '../../../../../../../admin/src/core/store/hooks.mjs';
import { useQueryParams } from '../../../../../../../admin/src/hooks/useQueryParams.mjs';
import { useRBAC } from '../../../../../../../admin/src/hooks/useRBAC.mjs';
import { Modal } from './components/Modal.mjs';
import { useAuditLogsData } from './hooks/useAuditLogsData.mjs';
import { useFormatTimeStamp } from './hooks/useFormatTimeStamp.mjs';
import { getDefaultMessage } from './utils/getActionTypesDefaultMessages.mjs';
import { getDisplayedFilters } from './utils/getDisplayedFilters.mjs';

const ListPage = ()=>{
    const { formatMessage } = useIntl();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings);
    const { allowedActions: { canRead: canReadAuditLogs, canReadUsers }, isLoading: isLoadingRBAC } = useRBAC({
        ...permissions?.auditLogs,
        readUsers: permissions?.users.read || []
    });
    const [{ query }, setQuery] = useQueryParams();
    const { auditLogs, users, isLoading: isLoadingData, hasError } = useAuditLogsData({
        canReadAuditLogs,
        canReadUsers
    });
    const formatTimeStamp = useFormatTimeStamp();
    const displayedFilters = getDisplayedFilters({
        formatMessage,
        users,
        canReadUsers
    });
    const headers = [
        {
            name: 'action',
            label: formatMessage({
                id: 'Settings.permissions.auditLogs.action',
                defaultMessage: 'Action'
            }),
            sortable: true
        },
        {
            name: 'date',
            label: formatMessage({
                id: 'Settings.permissions.auditLogs.date',
                defaultMessage: 'Date'
            }),
            sortable: true
        },
        {
            name: 'user',
            label: formatMessage({
                id: 'Settings.permissions.auditLogs.user',
                defaultMessage: 'User'
            }),
            sortable: false,
            // In this case, the passed parameter cannot and shouldn't be something else than User
            cellFormatter: ({ user })=>user ? user.displayName : ''
        }
    ];
    if (hasError) {
        return /*#__PURE__*/ jsx(Page.Error, {});
    }
    const isLoading = isLoadingData || isLoadingRBAC;
    const { results = [] } = auditLogs ?? {};
    return /*#__PURE__*/ jsxs(Page.Main, {
        "aria-busy": isLoading,
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: formatMessage({
                        id: 'global.auditLogs',
                        defaultMessage: 'Audit Logs'
                    })
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Header, {
                title: formatMessage({
                    id: 'global.auditLogs',
                    defaultMessage: 'Audit Logs'
                }),
                subtitle: formatMessage({
                    id: 'Settings.permissions.auditLogs.listview.header.subtitle',
                    defaultMessage: 'Logs of all the activities that happened in your environment'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Action, {
                startActions: /*#__PURE__*/ jsxs(Filters.Root, {
                    options: displayedFilters,
                    children: [
                        /*#__PURE__*/ jsx(Filters.Trigger, {}),
                        /*#__PURE__*/ jsx(Filters.Popover, {
                            zIndex: 499
                        }),
                        /*#__PURE__*/ jsx(Filters.List, {})
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Layouts.Content, {
                children: [
                    /*#__PURE__*/ jsx(Table.Root, {
                        rows: results,
                        headers: headers,
                        isLoading: isLoading,
                        children: /*#__PURE__*/ jsxs(Table.Content, {
                            children: [
                                /*#__PURE__*/ jsx(Table.Head, {
                                    children: headers.map((header)=>/*#__PURE__*/ jsx(Table.HeaderCell, {
                                            ...header
                                        }, header.name))
                                }),
                                /*#__PURE__*/ jsx(Table.Empty, {}),
                                /*#__PURE__*/ jsx(Table.Loading, {}),
                                /*#__PURE__*/ jsx(Table.Body, {
                                    children: results.map((log)=>/*#__PURE__*/ jsxs(Table.Row, {
                                            onClick: ()=>setQuery({
                                                    id: log.id
                                                }),
                                            children: [
                                                headers.map((header)=>{
                                                    const { name, cellFormatter } = header;
                                                    switch(name){
                                                        case 'action':
                                                            return /*#__PURE__*/ jsx(Table.Cell, {
                                                                children: /*#__PURE__*/ jsx(Typography, {
                                                                    textColor: "neutral800",
                                                                    children: formatMessage({
                                                                        id: `Settings.permissions.auditLogs.${log.action}`,
                                                                        // @ts-expect-error – getDefaultMessage probably doesn't benefit from being so strongly typed unless we just add string at the end.
                                                                        defaultMessage: getDefaultMessage(log.action)
                                                                    }, {
                                                                        model: log.payload?.model ?? ''
                                                                    })
                                                                })
                                                            }, name);
                                                        case 'date':
                                                            return /*#__PURE__*/ jsx(Table.Cell, {
                                                                children: /*#__PURE__*/ jsx(Typography, {
                                                                    textColor: "neutral800",
                                                                    children: formatTimeStamp(log.date)
                                                                })
                                                            }, name);
                                                        case 'user':
                                                            return /*#__PURE__*/ jsx(Table.Cell, {
                                                                children: /*#__PURE__*/ jsx(Typography, {
                                                                    textColor: "neutral800",
                                                                    children: cellFormatter ? cellFormatter(log, header) : '-'
                                                                })
                                                            }, name);
                                                        default:
                                                            return /*#__PURE__*/ jsx(Table.Cell, {
                                                                children: /*#__PURE__*/ jsx(Typography, {
                                                                    textColor: "neutral800",
                                                                    children: log[name] || '-'
                                                                })
                                                            }, name);
                                                    }
                                                }),
                                                /*#__PURE__*/ jsx(Table.Cell, {
                                                    onClick: (e)=>e.stopPropagation(),
                                                    children: /*#__PURE__*/ jsx(Flex, {
                                                        justifyContent: "end",
                                                        children: /*#__PURE__*/ jsx(IconButton, {
                                                            onClick: ()=>setQuery({
                                                                    id: log.id
                                                                }),
                                                            withTooltip: false,
                                                            label: formatMessage({
                                                                id: 'app.component.table.view',
                                                                defaultMessage: '{target} details'
                                                            }, {
                                                                target: `${log.action} action`
                                                            }),
                                                            variant: "ghost",
                                                            children: /*#__PURE__*/ jsx(Eye, {})
                                                        })
                                                    })
                                                })
                                            ]
                                        }, log.id))
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxs(Pagination.Root, {
                        ...auditLogs?.pagination,
                        children: [
                            /*#__PURE__*/ jsx(Pagination.PageSize, {}),
                            /*#__PURE__*/ jsx(Pagination.Links, {})
                        ]
                    })
                ]
            }),
            query?.id && /*#__PURE__*/ jsx(Modal, {
                handleClose: ()=>setQuery({
                        id: ''
                    }, 'remove'),
                logId: query.id.toString()
            })
        ]
    });
};
const ProtectedListPage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.auditLogs?.main);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(ListPage, {})
    });
};

export { ListPage, ProtectedListPage };
//# sourceMappingURL=ListPage.mjs.map
