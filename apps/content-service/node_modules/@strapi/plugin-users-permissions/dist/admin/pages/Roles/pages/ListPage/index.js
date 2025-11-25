'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var admin = require('@strapi/strapi/admin');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var reactRouterDom = require('react-router-dom');
var constants = require('../../../../constants.js');
require('lodash/isEmpty');
var getTrad = require('../../../../utils/getTrad.js');
var TableBody = require('./components/TableBody.js');

const RolesListPage = ()=>{
    const { trackUsage } = admin.useTracking();
    const { formatMessage, locale } = reactIntl.useIntl();
    const { toggleNotification } = admin.useNotification();
    const { notifyStatus } = designSystem.useNotifyAT();
    const [{ query }] = admin.useQueryParams();
    const _q = query?._q || '';
    const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
    const [roleToDelete, setRoleToDelete] = React.useState();
    const { del, get } = admin.useFetchClient();
    const { isLoading: isLoadingForPermissions, allowedActions: { canRead, canDelete, canCreate, canUpdate } } = admin.useRBAC({
        create: constants.PERMISSIONS.createRole,
        read: constants.PERMISSIONS.readRoles,
        update: constants.PERMISSIONS.updateRole,
        delete: constants.PERMISSIONS.deleteRole
    });
    const { isLoading: isLoadingForData, data: { roles }, isFetching, refetch } = reactQuery.useQuery('get-roles', ()=>fetchData(toggleNotification, formatMessage, notifyStatus), {
        initialData: {},
        enabled: canRead
    });
    const { contains } = designSystem.useFilter(locale, {
        sensitivity: 'base'
    });
    /**
   * @type {Intl.Collator}
   */ const formatter = designSystem.useCollator(locale, {
        sensitivity: 'base'
    });
    const isLoading = isLoadingForData || isFetching || isLoadingForPermissions;
    const handleShowConfirmDelete = ()=>{
        setShowConfirmDelete(!showConfirmDelete);
    };
    const deleteData = async (id, formatMessage, toggleNotification)=>{
        try {
            await del(`/users-permissions/roles/${id}`);
        } catch (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occured'
                })
            });
        }
    };
    const fetchData = async (toggleNotification, formatMessage, notifyStatus)=>{
        try {
            const { data } = await get('/users-permissions/roles');
            notifyStatus('The roles have loaded successfully');
            return data;
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
            throw new Error(err);
        }
    };
    const emptyLayout = {
        roles: {
            id: getTrad('Roles.empty'),
            defaultMessage: "You don't have any roles yet."
        },
        search: {
            id: getTrad('Roles.empty.search'),
            defaultMessage: 'No roles match the search.'
        }
    };
    const pageTitle = formatMessage({
        id: 'global.roles',
        defaultMessage: 'Roles'
    });
    const deleteMutation = reactQuery.useMutation((id)=>deleteData(id, formatMessage, toggleNotification), {
        async onSuccess () {
            await refetch();
        }
    });
    const handleConfirmDelete = async ()=>{
        await deleteMutation.mutateAsync(roleToDelete);
        setShowConfirmDelete(!showConfirmDelete);
    };
    const sortedRoles = (roles || []).filter((role)=>contains(role.name, _q) || contains(role.description, _q)).sort((a, b)=>formatter.compare(a.name, b.name) || formatter.compare(a.description, b.description));
    const emptyContent = _q && !sortedRoles.length ? 'search' : 'roles';
    const colCount = 4;
    const rowCount = (roles?.length || 0) + 1;
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(admin.Layouts.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: pageTitle
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(admin.Page.Main, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Header, {
                        title: formatMessage({
                            id: 'global.roles',
                            defaultMessage: 'Roles'
                        }),
                        subtitle: formatMessage({
                            id: 'Settings.roles.list.description',
                            defaultMessage: 'List of roles'
                        }),
                        primaryAction: canCreate ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                            to: "new",
                            tag: reactRouterDom.NavLink,
                            onClick: ()=>trackUsage('willCreateRole'),
                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                            size: "S",
                            children: formatMessage({
                                id: getTrad('List.button.roles'),
                                defaultMessage: 'Add new role'
                            })
                        }) : null
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Action, {
                        startActions: /*#__PURE__*/ jsxRuntime.jsx(admin.SearchInput, {
                            label: formatMessage({
                                id: 'app.component.search.label',
                                defaultMessage: 'Search'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(admin.Layouts.Content, {
                        children: [
                            !canRead && /*#__PURE__*/ jsxRuntime.jsx(admin.Page.NoPermissions, {}),
                            canRead && sortedRoles && sortedRoles?.length ? /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Table, {
                                colCount: colCount,
                                rowCount: rowCount,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Thead, {
                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        variant: "sigma",
                                                        textColor: "neutral600",
                                                        children: formatMessage({
                                                            id: 'global.name',
                                                            defaultMessage: 'Name'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        variant: "sigma",
                                                        textColor: "neutral600",
                                                        children: formatMessage({
                                                            id: 'global.description',
                                                            defaultMessage: 'Description'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        variant: "sigma",
                                                        textColor: "neutral600",
                                                        children: formatMessage({
                                                            id: 'global.users',
                                                            defaultMessage: 'Users'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                                        children: formatMessage({
                                                            id: 'global.actions',
                                                            defaultMessage: 'Actions'
                                                        })
                                                    })
                                                })
                                            ]
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(TableBody, {
                                        sortedRoles: sortedRoles,
                                        canDelete: canDelete,
                                        canUpdate: canUpdate,
                                        permissions: constants.PERMISSIONS,
                                        setRoleToDelete: setRoleToDelete,
                                        onDelete: [
                                            showConfirmDelete,
                                            setShowConfirmDelete
                                        ]
                                    })
                                ]
                            }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
                                content: formatMessage(emptyLayout[emptyContent])
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                        open: showConfirmDelete,
                        onOpenChange: handleShowConfirmDelete,
                        children: /*#__PURE__*/ jsxRuntime.jsx(admin.ConfirmDialog, {
                            onConfirm: handleConfirmDelete
                        })
                    })
                ]
            })
        ]
    });
};
const ProtectedRolesListPage = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Protect, {
        permissions: constants.PERMISSIONS.accessRoles,
        children: /*#__PURE__*/ jsxRuntime.jsx(RolesListPage, {})
    });
};

exports.ProtectedRolesListPage = ProtectedRolesListPage;
exports.RolesListPage = RolesListPage;
//# sourceMappingURL=index.js.map
