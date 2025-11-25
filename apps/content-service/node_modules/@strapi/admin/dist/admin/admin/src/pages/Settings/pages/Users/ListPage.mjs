import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Typography, Flex, IconButton, Dialog, Status } from '@strapi/design-system';
import { Pencil, Trash } from '@strapi/icons';
import * as qs from 'qs';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { ConfirmDialog } from '../../../../components/ConfirmDialog.mjs';
import { Filters } from '../../../../components/Filters.mjs';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { Pagination } from '../../../../components/Pagination.mjs';
import { SearchInput } from '../../../../components/SearchInput.mjs';
import { Table } from '../../../../components/Table.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useEnterprise } from '../../../../hooks/useEnterprise.mjs';
import { useRBAC } from '../../../../hooks/useRBAC.mjs';
import { useAdminUsers, useDeleteManyUsersMutation } from '../../../../services/users.mjs';
import { getDisplayName } from '../../../../utils/users.mjs';
import { CreateActionCE } from './components/CreateActionCE.mjs';
import { ModalForm } from './components/NewUserForm.mjs';

/* -------------------------------------------------------------------------------------------------
 * ListPageCE
 * -----------------------------------------------------------------------------------------------*/ const ListPageCE = ()=>{
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const [isModalOpened, setIsModalOpen] = React.useState(false);
    const permissions = useTypedSelector((state)=>state.admin_app.permissions);
    const { allowedActions: { canCreate, canDelete, canRead } } = useRBAC(permissions.settings?.users);
    const navigate = useNavigate();
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const { search } = useLocation();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
    const [idsToDelete, setIdsToDelete] = React.useState([]);
    const { data, isError, isLoading } = useAdminUsers(qs.parse(search, {
        ignoreQueryPrefix: true
    }));
    const { pagination, users = [] } = data ?? {};
    const CreateAction = useEnterprise(CreateActionCE, async ()=>(await import('../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/CreateActionEE.mjs')).CreateActionEE);
    const headers = TABLE_HEADERS.map((header)=>({
            ...header,
            label: formatMessage(header.label)
        }));
    const title = formatMessage({
        id: 'global.users',
        defaultMessage: 'Users'
    });
    const handleToggle = ()=>{
        setIsModalOpen((prev)=>!prev);
    };
    const [deleteAll] = useDeleteManyUsersMutation();
    const handleDeleteAll = async (ids)=>{
        try {
            const res = await deleteAll({
                ids
            });
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
            }
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'global.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    const handleRowClick = (id)=>()=>{
            if (canRead) {
                navigate(id.toString());
            }
        };
    const handleDeleteClick = (id)=>async ()=>{
            setIdsToDelete([
                id
            ]);
            setShowDeleteConfirmation(true);
        };
    const confirmDelete = async ()=>{
        await handleDeleteAll(idsToDelete);
        setShowDeleteConfirmation(false);
    };
    // block rendering until the EE component is fully loaded
    if (!CreateAction) {
        return null;
    }
    if (isError) {
        return /*#__PURE__*/ jsx(Page.Error, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        "aria-busy": isLoading,
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Users'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Header, {
                primaryAction: canCreate && /*#__PURE__*/ jsx(CreateAction, {
                    onClick: handleToggle
                }),
                title: title,
                subtitle: formatMessage({
                    id: 'Settings.permissions.users.listview.header.subtitle',
                    defaultMessage: 'All the users who have access to the Strapi admin panel'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Action, {
                startActions: /*#__PURE__*/ jsxs(Fragment, {
                    children: [
                        /*#__PURE__*/ jsx(SearchInput, {
                            label: formatMessage({
                                id: 'app.component.search.label',
                                defaultMessage: 'Search for {target}'
                            }, {
                                target: title
                            })
                        }),
                        /*#__PURE__*/ jsxs(Filters.Root, {
                            options: FILTERS,
                            children: [
                                /*#__PURE__*/ jsx(Filters.Trigger, {}),
                                /*#__PURE__*/ jsx(Filters.Popover, {
                                    zIndex: 499
                                }),
                                /*#__PURE__*/ jsx(Filters.List, {})
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Layouts.Content, {
                children: [
                    /*#__PURE__*/ jsxs(Table.Root, {
                        rows: users,
                        headers: headers,
                        children: [
                            /*#__PURE__*/ jsx(Table.ActionBar, {}),
                            /*#__PURE__*/ jsxs(Table.Content, {
                                children: [
                                    /*#__PURE__*/ jsxs(Table.Head, {
                                        children: [
                                            canDelete ? /*#__PURE__*/ jsx(Table.HeaderCheckboxCell, {}) : null,
                                            headers.map((header)=>/*#__PURE__*/ jsx(Table.HeaderCell, {
                                                    ...header
                                                }, header.name))
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx(Table.Empty, {}),
                                    /*#__PURE__*/ jsx(Table.Loading, {}),
                                    /*#__PURE__*/ jsx(Table.Body, {
                                        children: users.map((user)=>/*#__PURE__*/ jsxs(Table.Row, {
                                                onClick: handleRowClick(user.id),
                                                cursor: canRead ? 'pointer' : 'default',
                                                children: [
                                                    canDelete ? /*#__PURE__*/ jsx(Table.CheckboxCell, {
                                                        id: user.id
                                                    }) : null,
                                                    headers.map(({ cellFormatter, name, ...rest })=>{
                                                        return /*#__PURE__*/ jsx(Table.Cell, {
                                                            children: typeof cellFormatter === 'function' ? cellFormatter(user, {
                                                                name,
                                                                ...rest
                                                            }) : // @ts-expect-error – name === "roles" has the data value of `AdminRole[]` but the header has a cellFormatter value so this shouldn't be called.
                                                            /*#__PURE__*/ jsx(Typography, {
                                                                textColor: "neutral800",
                                                                children: user[name] || '-'
                                                            })
                                                        }, name);
                                                    }),
                                                    canRead || canDelete ? /*#__PURE__*/ jsx(Table.Cell, {
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: /*#__PURE__*/ jsxs(Flex, {
                                                            justifyContent: "end",
                                                            children: [
                                                                canRead ? /*#__PURE__*/ jsx(IconButton, {
                                                                    tag: NavLink,
                                                                    to: user.id.toString(),
                                                                    label: formatMessage({
                                                                        id: 'app.component.table.edit',
                                                                        defaultMessage: 'Edit {target}'
                                                                    }, {
                                                                        target: getDisplayName(user)
                                                                    }),
                                                                    variant: "ghost",
                                                                    children: /*#__PURE__*/ jsx(Pencil, {})
                                                                }) : null,
                                                                canDelete ? /*#__PURE__*/ jsx(IconButton, {
                                                                    onClick: handleDeleteClick(user.id),
                                                                    label: formatMessage({
                                                                        id: 'global.delete-target',
                                                                        defaultMessage: 'Delete {target}'
                                                                    }, {
                                                                        target: getDisplayName(user)
                                                                    }),
                                                                    variant: "ghost",
                                                                    children: /*#__PURE__*/ jsx(Trash, {})
                                                                }) : null
                                                            ]
                                                        })
                                                    }) : null
                                                ]
                                            }, user.id))
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxs(Pagination.Root, {
                        ...pagination,
                        children: [
                            /*#__PURE__*/ jsx(Pagination.PageSize, {}),
                            /*#__PURE__*/ jsx(Pagination.Links, {})
                        ]
                    })
                ]
            }),
            isModalOpened && /*#__PURE__*/ jsx(ModalForm, {
                onToggle: handleToggle
            }),
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: showDeleteConfirmation,
                onOpenChange: setShowDeleteConfirmation,
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                    onConfirm: confirmDelete
                })
            })
        ]
    });
};
const TABLE_HEADERS = [
    {
        name: 'firstname',
        label: {
            id: 'Settings.permissions.users.firstname',
            defaultMessage: 'Firstname'
        },
        sortable: true
    },
    {
        name: 'lastname',
        label: {
            id: 'Settings.permissions.users.lastname',
            defaultMessage: 'Lastname'
        },
        sortable: true
    },
    {
        name: 'email',
        label: {
            id: 'Settings.permissions.users.email',
            defaultMessage: 'Email'
        },
        sortable: true
    },
    {
        name: 'roles',
        label: {
            id: 'Settings.permissions.users.roles',
            defaultMessage: 'Roles'
        },
        sortable: false,
        cellFormatter ({ roles }) {
            return /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral800",
                children: roles.map((role)=>role.name).join(',\n')
            });
        }
    },
    {
        name: 'username',
        label: {
            id: 'Settings.permissions.users.username',
            defaultMessage: 'Username'
        },
        sortable: true
    },
    {
        name: 'isActive',
        label: {
            id: 'Settings.permissions.users.user-status',
            defaultMessage: 'User status'
        },
        sortable: false,
        cellFormatter ({ isActive }) {
            return /*#__PURE__*/ jsx(Flex, {
                children: /*#__PURE__*/ jsx(Status, {
                    size: "S",
                    variant: isActive ? 'success' : 'danger',
                    children: /*#__PURE__*/ jsx(Typography, {
                        tag: "span",
                        variant: "omega",
                        fontWeight: "bold",
                        children: isActive ? 'Active' : 'Inactive'
                    })
                })
            });
        }
    }
];
const FILTERS = [
    {
        name: 'firstname',
        label: 'Firstname',
        type: 'string'
    },
    {
        name: 'lastname',
        label: 'Lastname',
        type: 'string'
    },
    {
        name: 'email',
        label: 'Email',
        type: 'email'
    },
    {
        name: 'username',
        label: 'Username',
        type: 'string'
    },
    {
        name: 'isActive',
        label: 'Active user',
        type: 'boolean'
    }
];
/* -------------------------------------------------------------------------------------------------
 * ListPage
 * -----------------------------------------------------------------------------------------------*/ // component which determines whether this page should render the CE or EE page
const ListPage = ()=>{
    const UsersListPage = useEnterprise(ListPageCE, async ()=>// eslint-disable-next-line import/no-cycle
        (await import('../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/ListPage.mjs')).UserListPageEE);
    // block rendering until the EE component is fully loaded
    if (!UsersListPage) {
        return null;
    }
    return /*#__PURE__*/ jsx(UsersListPage, {});
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedListPage
 * -----------------------------------------------------------------------------------------------*/ const ProtectedListPage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.users.read);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(ListPage, {})
    });
};

export { ListPage, ListPageCE, ProtectedListPage };
//# sourceMappingURL=ListPage.mjs.map
