import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { useNotifyAT, useFilter, useCollator, LinkButton, Table, Thead, Tr, Th, Typography, VisuallyHidden, EmptyStateLayout, Dialog } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { Page, useTracking, useNotification, useQueryParams, useFetchClient, useRBAC, Layouts, SearchInput, ConfirmDialog } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { useQuery, useMutation } from 'react-query';
import { NavLink } from 'react-router-dom';
import { PERMISSIONS } from '../../../../constants.mjs';
import 'lodash/isEmpty';
import getTrad from '../../../../utils/getTrad.mjs';
import TableBody from './components/TableBody.mjs';

const RolesListPage = ()=>{
    const { trackUsage } = useTracking();
    const { formatMessage, locale } = useIntl();
    const { toggleNotification } = useNotification();
    const { notifyStatus } = useNotifyAT();
    const [{ query }] = useQueryParams();
    const _q = query?._q || '';
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState();
    const { del, get } = useFetchClient();
    const { isLoading: isLoadingForPermissions, allowedActions: { canRead, canDelete, canCreate, canUpdate } } = useRBAC({
        create: PERMISSIONS.createRole,
        read: PERMISSIONS.readRoles,
        update: PERMISSIONS.updateRole,
        delete: PERMISSIONS.deleteRole
    });
    const { isLoading: isLoadingForData, data: { roles }, isFetching, refetch } = useQuery('get-roles', ()=>fetchData(toggleNotification, formatMessage, notifyStatus), {
        initialData: {},
        enabled: canRead
    });
    const { contains } = useFilter(locale, {
        sensitivity: 'base'
    });
    /**
   * @type {Intl.Collator}
   */ const formatter = useCollator(locale, {
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
    const deleteMutation = useMutation((id)=>deleteData(id, formatMessage, toggleNotification), {
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Layouts.Root, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: pageTitle
                })
            }),
            /*#__PURE__*/ jsxs(Page.Main, {
                children: [
                    /*#__PURE__*/ jsx(Layouts.Header, {
                        title: formatMessage({
                            id: 'global.roles',
                            defaultMessage: 'Roles'
                        }),
                        subtitle: formatMessage({
                            id: 'Settings.roles.list.description',
                            defaultMessage: 'List of roles'
                        }),
                        primaryAction: canCreate ? /*#__PURE__*/ jsx(LinkButton, {
                            to: "new",
                            tag: NavLink,
                            onClick: ()=>trackUsage('willCreateRole'),
                            startIcon: /*#__PURE__*/ jsx(Plus, {}),
                            size: "S",
                            children: formatMessage({
                                id: getTrad('List.button.roles'),
                                defaultMessage: 'Add new role'
                            })
                        }) : null
                    }),
                    /*#__PURE__*/ jsx(Layouts.Action, {
                        startActions: /*#__PURE__*/ jsx(SearchInput, {
                            label: formatMessage({
                                id: 'app.component.search.label',
                                defaultMessage: 'Search'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxs(Layouts.Content, {
                        children: [
                            !canRead && /*#__PURE__*/ jsx(Page.NoPermissions, {}),
                            canRead && sortedRoles && sortedRoles?.length ? /*#__PURE__*/ jsxs(Table, {
                                colCount: colCount,
                                rowCount: rowCount,
                                children: [
                                    /*#__PURE__*/ jsx(Thead, {
                                        children: /*#__PURE__*/ jsxs(Tr, {
                                            children: [
                                                /*#__PURE__*/ jsx(Th, {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        variant: "sigma",
                                                        textColor: "neutral600",
                                                        children: formatMessage({
                                                            id: 'global.name',
                                                            defaultMessage: 'Name'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Th, {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        variant: "sigma",
                                                        textColor: "neutral600",
                                                        children: formatMessage({
                                                            id: 'global.description',
                                                            defaultMessage: 'Description'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Th, {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        variant: "sigma",
                                                        textColor: "neutral600",
                                                        children: formatMessage({
                                                            id: 'global.users',
                                                            defaultMessage: 'Users'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Th, {
                                                    children: /*#__PURE__*/ jsx(VisuallyHidden, {
                                                        children: formatMessage({
                                                            id: 'global.actions',
                                                            defaultMessage: 'Actions'
                                                        })
                                                    })
                                                })
                                            ]
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(TableBody, {
                                        sortedRoles: sortedRoles,
                                        canDelete: canDelete,
                                        canUpdate: canUpdate,
                                        permissions: PERMISSIONS,
                                        setRoleToDelete: setRoleToDelete,
                                        onDelete: [
                                            showConfirmDelete,
                                            setShowConfirmDelete
                                        ]
                                    })
                                ]
                            }) : /*#__PURE__*/ jsx(EmptyStateLayout, {
                                content: formatMessage(emptyLayout[emptyContent])
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(Dialog.Root, {
                        open: showConfirmDelete,
                        onOpenChange: handleShowConfirmDelete,
                        children: /*#__PURE__*/ jsx(ConfirmDialog, {
                            onConfirm: handleConfirmDelete
                        })
                    })
                ]
            })
        ]
    });
};
const ProtectedRolesListPage = ()=>{
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.accessRoles,
        children: /*#__PURE__*/ jsx(RolesListPage, {})
    });
};

export { ProtectedRolesListPage, RolesListPage };
//# sourceMappingURL=index.mjs.map
