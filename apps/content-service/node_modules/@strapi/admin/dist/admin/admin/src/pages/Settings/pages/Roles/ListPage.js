'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var immer = require('immer');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var ConfirmDialog = require('../../../../components/ConfirmDialog.js');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var SearchInput = require('../../../../components/SearchInput.js');
var hooks = require('../../../../core/store/hooks.js');
var Notifications = require('../../../../features/Notifications.js');
var useAdminRoles = require('../../../../hooks/useAdminRoles.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var useFetchClient = require('../../../../hooks/useFetchClient.js');
var useQueryParams = require('../../../../hooks/useQueryParams.js');
var useRBAC = require('../../../../hooks/useRBAC.js');
var selectors = require('../../../../selectors.js');
var getFetchClient = require('../../../../utils/getFetchClient.js');
var RoleRow = require('./components/RoleRow.js');

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

const ListPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const permissions = hooks.useTypedSelector(selectors.selectAdminPermissions);
    const { formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const { toggleNotification } = Notifications.useNotification();
    const [isWarningDeleteAllOpened, setIsWarningDeleteAllOpenend] = React__namespace.useState(false);
    const [{ query }] = useQueryParams.useQueryParams();
    const { isLoading: isLoadingForPermissions, allowedActions: { canCreate, canDelete, canRead, canUpdate } } = useRBAC.useRBAC(permissions.settings?.roles);
    const { roles, refetch: refetchRoles } = useAdminRoles.useAdminRoles({
        filters: query?._q ? {
            name: {
                $containsi: query._q
            }
        } : undefined
    }, {
        refetchOnMountOrArgChange: true,
        skip: isLoadingForPermissions || !canRead
    });
    const navigate = reactRouterDom.useNavigate();
    const [{ roleToDelete }, dispatch] = React__namespace.useReducer(reducer, initialState);
    const { post } = useFetchClient.useFetchClient();
    const handleDeleteData = async ()=>{
        try {
            dispatch({
                type: 'ON_REMOVE_ROLES'
            });
            await post('/admin/roles/batch-delete', {
                ids: [
                    roleToDelete
                ]
            });
            await refetchRoles();
            dispatch({
                type: 'RESET_DATA_TO_DELETE'
            });
        } catch (error) {
            if (getFetchClient.isFetchError(error)) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(error)
                });
            }
        }
    };
    const handleNewRoleClick = ()=>navigate('new');
    const handleToggleModal = ()=>setIsWarningDeleteAllOpenend((prev)=>!prev);
    const handleClickDelete = (role)=>(e)=>{
            e.preventDefault();
            e.stopPropagation();
            if (role.usersCount) {
                toggleNotification({
                    type: 'info',
                    message: formatMessage({
                        id: 'Roles.ListPage.notification.delete-not-allowed'
                    })
                });
            } else {
                dispatch({
                    type: 'SET_ROLE_TO_DELETE',
                    id: role.id
                });
                handleToggleModal();
            }
        };
    const handleClickDuplicate = (role)=>(e)=>{
            e.preventDefault();
            e.stopPropagation();
            navigate(`duplicate/${role.id}`);
        };
    const rowCount = roles.length + 1;
    const colCount = 6;
    if (isLoadingForPermissions) {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Roles'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                primaryAction: canCreate ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    onClick: handleNewRoleClick,
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                    size: "S",
                    children: formatMessage({
                        id: 'Settings.roles.list.button.add',
                        defaultMessage: 'Add new role'
                    })
                }) : null,
                title: formatMessage({
                    id: 'global.roles',
                    defaultMessage: 'roles'
                }),
                subtitle: formatMessage({
                    id: 'Settings.roles.list.description',
                    defaultMessage: 'List of roles'
                })
            }),
            canRead && /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Action, {
                startActions: /*#__PURE__*/ jsxRuntime.jsx(SearchInput.SearchInput, {
                    label: formatMessage({
                        id: 'app.component.search.label',
                        defaultMessage: 'Search for {target}'
                    }, {
                        target: formatMessage({
                            id: 'global.roles',
                            defaultMessage: 'roles'
                        })
                    })
                })
            }),
            canRead && /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Table, {
                    colCount: colCount,
                    rowCount: rowCount,
                    footer: canCreate ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.TFooter, {
                        cursor: "pointer",
                        onClick: handleNewRoleClick,
                        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                        children: formatMessage({
                            id: 'Settings.roles.list.button.add',
                            defaultMessage: 'Add new role'
                        })
                    }) : null,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Thead, {
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                "aria-rowindex": 1,
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
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
                            children: roles?.map((role, index)=>/*#__PURE__*/ jsxRuntime.jsx(RoleRow.RoleRow, {
                                    cursor: "pointer",
                                    id: role.id,
                                    name: role.name,
                                    description: role.description,
                                    usersCount: role.usersCount,
                                    icons: [
                                        canCreate && {
                                            onClick: handleClickDuplicate(role),
                                            label: formatMessage({
                                                id: 'app.utils.duplicate',
                                                defaultMessage: 'Duplicate'
                                            }),
                                            children: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {})
                                        },
                                        canUpdate && {
                                            onClick: ()=>navigate(role.id.toString()),
                                            label: formatMessage({
                                                id: 'app.utils.edit',
                                                defaultMessage: 'Edit'
                                            }),
                                            children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                        },
                                        canDelete && {
                                            onClick: handleClickDelete(role),
                                            label: formatMessage({
                                                id: 'global.delete',
                                                defaultMessage: 'Delete'
                                            }),
                                            children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
                                        }
                                    ].filter(Boolean),
                                    rowIndex: index + 2,
                                    canUpdate: canUpdate
                                }, role.id))
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                open: isWarningDeleteAllOpened,
                onOpenChange: handleToggleModal,
                children: /*#__PURE__*/ jsxRuntime.jsx(ConfirmDialog.ConfirmDialog, {
                    onConfirm: handleDeleteData
                })
            })
        ]
    });
};
const initialState = {
    roleToDelete: null,
    showModalConfirmButtonLoading: false,
    shouldRefetchData: false
};
const reducer = (state, action)=>immer.produce(state, (draftState)=>{
        switch(action.type){
            case 'ON_REMOVE_ROLES':
                {
                    draftState.showModalConfirmButtonLoading = true;
                    break;
                }
            case 'ON_REMOVE_ROLES_SUCCEEDED':
                {
                    draftState.shouldRefetchData = true;
                    draftState.roleToDelete = null;
                    break;
                }
            case 'RESET_DATA_TO_DELETE':
                {
                    draftState.shouldRefetchData = false;
                    draftState.roleToDelete = null;
                    draftState.showModalConfirmButtonLoading = false;
                    break;
                }
            case 'SET_ROLE_TO_DELETE':
                {
                    draftState.roleToDelete = action.id;
                    break;
                }
            default:
                return draftState;
        }
    });
/* -------------------------------------------------------------------------------------------------
 * ProtectedListPage
 * -----------------------------------------------------------------------------------------------*/ const ProtectedListPage = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.roles.read);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(ListPage, {})
    });
};

exports.ListPage = ListPage;
exports.ProtectedListPage = ProtectedListPage;
//# sourceMappingURL=ListPage.js.map
