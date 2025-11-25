'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var Filters = require('../../../../../../../admin/src/components/Filters.js');
var Layout = require('../../../../../../../admin/src/components/Layouts/Layout.js');
var PageHelpers = require('../../../../../../../admin/src/components/PageHelpers.js');
var Pagination = require('../../../../../../../admin/src/components/Pagination.js');
var Table = require('../../../../../../../admin/src/components/Table.js');
var hooks = require('../../../../../../../admin/src/core/store/hooks.js');
var useQueryParams = require('../../../../../../../admin/src/hooks/useQueryParams.js');
var useRBAC = require('../../../../../../../admin/src/hooks/useRBAC.js');
var Modal = require('./components/Modal.js');
var useAuditLogsData = require('./hooks/useAuditLogsData.js');
var useFormatTimeStamp = require('./hooks/useFormatTimeStamp.js');
var getActionTypesDefaultMessages = require('./utils/getActionTypesDefaultMessages.js');
var getDisplayedFilters = require('./utils/getDisplayedFilters.js');

const ListPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings);
    const { allowedActions: { canRead: canReadAuditLogs, canReadUsers }, isLoading: isLoadingRBAC } = useRBAC.useRBAC({
        ...permissions?.auditLogs,
        readUsers: permissions?.users.read || []
    });
    const [{ query }, setQuery] = useQueryParams.useQueryParams();
    const { auditLogs, users, isLoading: isLoadingData, hasError } = useAuditLogsData.useAuditLogsData({
        canReadAuditLogs,
        canReadUsers
    });
    const formatTimeStamp = useFormatTimeStamp.useFormatTimeStamp();
    const displayedFilters = getDisplayedFilters.getDisplayedFilters({
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
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Error, {});
    }
    const isLoading = isLoadingData || isLoadingRBAC;
    const { results = [] } = auditLogs ?? {};
    return /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
        "aria-busy": isLoading,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
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
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                title: formatMessage({
                    id: 'global.auditLogs',
                    defaultMessage: 'Audit Logs'
                }),
                subtitle: formatMessage({
                    id: 'Settings.permissions.auditLogs.listview.header.subtitle',
                    defaultMessage: 'Logs of all the activities that happened in your environment'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Action, {
                startActions: /*#__PURE__*/ jsxRuntime.jsxs(Filters.Filters.Root, {
                    options: displayedFilters,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(Filters.Filters.Trigger, {}),
                        /*#__PURE__*/ jsxRuntime.jsx(Filters.Filters.Popover, {
                            zIndex: 499
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(Filters.Filters.List, {})
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(Layout.Layouts.Content, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Root, {
                        rows: results,
                        headers: headers,
                        isLoading: isLoading,
                        children: /*#__PURE__*/ jsxRuntime.jsxs(Table.Table.Content, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Head, {
                                    children: headers.map((header)=>/*#__PURE__*/ jsxRuntime.jsx(Table.Table.HeaderCell, {
                                            ...header
                                        }, header.name))
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Empty, {}),
                                /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Loading, {}),
                                /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Body, {
                                    children: results.map((log)=>/*#__PURE__*/ jsxRuntime.jsxs(Table.Table.Row, {
                                            onClick: ()=>setQuery({
                                                    id: log.id
                                                }),
                                            children: [
                                                headers.map((header)=>{
                                                    const { name, cellFormatter } = header;
                                                    switch(name){
                                                        case 'action':
                                                            return /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Cell, {
                                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                    textColor: "neutral800",
                                                                    children: formatMessage({
                                                                        id: `Settings.permissions.auditLogs.${log.action}`,
                                                                        // @ts-expect-error – getDefaultMessage probably doesn't benefit from being so strongly typed unless we just add string at the end.
                                                                        defaultMessage: getActionTypesDefaultMessages.getDefaultMessage(log.action)
                                                                    }, {
                                                                        model: log.payload?.model ?? ''
                                                                    })
                                                                })
                                                            }, name);
                                                        case 'date':
                                                            return /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Cell, {
                                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                    textColor: "neutral800",
                                                                    children: formatTimeStamp(log.date)
                                                                })
                                                            }, name);
                                                        case 'user':
                                                            return /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Cell, {
                                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                    textColor: "neutral800",
                                                                    children: cellFormatter ? cellFormatter(log, header) : '-'
                                                                })
                                                            }, name);
                                                        default:
                                                            return /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Cell, {
                                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                    textColor: "neutral800",
                                                                    children: log[name] || '-'
                                                                })
                                                            }, name);
                                                    }
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Cell, {
                                                    onClick: (e)=>e.stopPropagation(),
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                                        justifyContent: "end",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
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
                                                            children: /*#__PURE__*/ jsxRuntime.jsx(icons.Eye, {})
                                                        })
                                                    })
                                                })
                                            ]
                                        }, log.id))
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(Pagination.Pagination.Root, {
                        ...auditLogs?.pagination,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(Pagination.Pagination.PageSize, {}),
                            /*#__PURE__*/ jsxRuntime.jsx(Pagination.Pagination.Links, {})
                        ]
                    })
                ]
            }),
            query?.id && /*#__PURE__*/ jsxRuntime.jsx(Modal.Modal, {
                handleClose: ()=>setQuery({
                        id: ''
                    }, 'remove'),
                logId: query.id.toString()
            })
        ]
    });
};
const ProtectedListPage = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.auditLogs?.main);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(ListPage, {})
    });
};

exports.ListPage = ListPage;
exports.ProtectedListPage = ProtectedListPage;
//# sourceMappingURL=ListPage.js.map
