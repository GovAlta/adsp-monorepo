'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var ConfirmDialog = require('../../../../components/ConfirmDialog.js');
var Filters = require('../../../../components/Filters.js');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var Pagination = require('../../../../components/Pagination.js');
var SearchInput = require('../../../../components/SearchInput.js');
var Table = require('../../../../components/Table.js');
var hooks = require('../../../../core/store/hooks.js');
var Notifications = require('../../../../features/Notifications.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var useEnterprise = require('../../../../hooks/useEnterprise.js');
var useRBAC = require('../../../../hooks/useRBAC.js');
var users = require('../../../../services/users.js');
var users$1 = require('../../../../utils/users.js');
var CreateActionCE = require('./components/CreateActionCE.js');
var NewUserForm = require('./components/NewUserForm.js');

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

/* -------------------------------------------------------------------------------------------------
 * ListPageCE
 * -----------------------------------------------------------------------------------------------*/ const ListPageCE = ()=>{
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const [isModalOpened, setIsModalOpen] = React__namespace.useState(false);
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions);
    const { allowedActions: { canCreate, canDelete, canRead } } = useRBAC.useRBAC(permissions.settings?.users);
    const navigate = reactRouterDom.useNavigate();
    const { toggleNotification } = Notifications.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const { search } = reactRouterDom.useLocation();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = React__namespace.useState(false);
    const [idsToDelete, setIdsToDelete] = React__namespace.useState([]);
    const { data, isError, isLoading } = users.useAdminUsers(qs__namespace.parse(search, {
        ignoreQueryPrefix: true
    }));
    const { pagination, users: users$2 = [] } = data ?? {};
    const CreateAction = useEnterprise.useEnterprise(CreateActionCE.CreateActionCE, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/CreateActionEE.js'); })).CreateActionEE);
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
    const [deleteAll] = users.useDeleteManyUsersMutation();
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
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Error, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
        "aria-busy": isLoading,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Users'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                primaryAction: canCreate && /*#__PURE__*/ jsxRuntime.jsx(CreateAction, {
                    onClick: handleToggle
                }),
                title: title,
                subtitle: formatMessage({
                    id: 'Settings.permissions.users.listview.header.subtitle',
                    defaultMessage: 'All the users who have access to the Strapi admin panel'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Action, {
                startActions: /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(SearchInput.SearchInput, {
                            label: formatMessage({
                                id: 'app.component.search.label',
                                defaultMessage: 'Search for {target}'
                            }, {
                                target: title
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(Filters.Filters.Root, {
                            options: FILTERS,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(Filters.Filters.Trigger, {}),
                                /*#__PURE__*/ jsxRuntime.jsx(Filters.Filters.Popover, {
                                    zIndex: 499
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Filters.Filters.List, {})
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(Layout.Layouts.Content, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(Table.Table.Root, {
                        rows: users$2,
                        headers: headers,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(Table.Table.ActionBar, {}),
                            /*#__PURE__*/ jsxRuntime.jsxs(Table.Table.Content, {
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsxs(Table.Table.Head, {
                                        children: [
                                            canDelete ? /*#__PURE__*/ jsxRuntime.jsx(Table.Table.HeaderCheckboxCell, {}) : null,
                                            headers.map((header)=>/*#__PURE__*/ jsxRuntime.jsx(Table.Table.HeaderCell, {
                                                    ...header
                                                }, header.name))
                                        ]
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Empty, {}),
                                    /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Loading, {}),
                                    /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Body, {
                                        children: users$2.map((user)=>/*#__PURE__*/ jsxRuntime.jsxs(Table.Table.Row, {
                                                onClick: handleRowClick(user.id),
                                                cursor: canRead ? 'pointer' : 'default',
                                                children: [
                                                    canDelete ? /*#__PURE__*/ jsxRuntime.jsx(Table.Table.CheckboxCell, {
                                                        id: user.id
                                                    }) : null,
                                                    headers.map(({ cellFormatter, name, ...rest })=>{
                                                        return /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Cell, {
                                                            children: typeof cellFormatter === 'function' ? cellFormatter(user, {
                                                                name,
                                                                ...rest
                                                            }) : // @ts-expect-error – name === "roles" has the data value of `AdminRole[]` but the header has a cellFormatter value so this shouldn't be called.
                                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                textColor: "neutral800",
                                                                children: user[name] || '-'
                                                            })
                                                        }, name);
                                                    }),
                                                    canRead || canDelete ? /*#__PURE__*/ jsxRuntime.jsx(Table.Table.Cell, {
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                            justifyContent: "end",
                                                            children: [
                                                                canRead ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                                                    tag: reactRouterDom.NavLink,
                                                                    to: user.id.toString(),
                                                                    label: formatMessage({
                                                                        id: 'app.component.table.edit',
                                                                        defaultMessage: 'Edit {target}'
                                                                    }, {
                                                                        target: users$1.getDisplayName(user)
                                                                    }),
                                                                    variant: "ghost",
                                                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                                                }) : null,
                                                                canDelete ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                                                    onClick: handleDeleteClick(user.id),
                                                                    label: formatMessage({
                                                                        id: 'global.delete-target',
                                                                        defaultMessage: 'Delete {target}'
                                                                    }, {
                                                                        target: users$1.getDisplayName(user)
                                                                    }),
                                                                    variant: "ghost",
                                                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
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
                    /*#__PURE__*/ jsxRuntime.jsxs(Pagination.Pagination.Root, {
                        ...pagination,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(Pagination.Pagination.PageSize, {}),
                            /*#__PURE__*/ jsxRuntime.jsx(Pagination.Pagination.Links, {})
                        ]
                    })
                ]
            }),
            isModalOpened && /*#__PURE__*/ jsxRuntime.jsx(NewUserForm.ModalForm, {
                onToggle: handleToggle
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                open: showDeleteConfirmation,
                onOpenChange: setShowDeleteConfirmation,
                children: /*#__PURE__*/ jsxRuntime.jsx(ConfirmDialog.ConfirmDialog, {
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
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Status, {
                    size: "S",
                    variant: isActive ? 'success' : 'danger',
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
    const UsersListPage = useEnterprise.useEnterprise(ListPageCE, async ()=>// eslint-disable-next-line import/no-cycle
        (await Promise.resolve().then(function () { return require('../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/ListPage.js'); })).UserListPageEE);
    // block rendering until the EE component is fully loaded
    if (!UsersListPage) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(UsersListPage, {});
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedListPage
 * -----------------------------------------------------------------------------------------------*/ const ProtectedListPage = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.users.read);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(ListPage, {})
    });
};

exports.ListPage = ListPage;
exports.ListPageCE = ListPageCE;
exports.ProtectedListPage = ProtectedListPage;
//# sourceMappingURL=ListPage.js.map
