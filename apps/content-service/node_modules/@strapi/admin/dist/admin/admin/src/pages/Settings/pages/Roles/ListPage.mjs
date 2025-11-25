import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Button, Table, TFooter, Thead, Tr, Th, Typography, VisuallyHidden, Tbody, Dialog } from '@strapi/design-system';
import { Plus, Duplicate, Pencil, Trash } from '@strapi/icons';
import { produce } from 'immer';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../../components/ConfirmDialog.mjs';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { SearchInput } from '../../../../components/SearchInput.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useAdminRoles } from '../../../../hooks/useAdminRoles.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useFetchClient } from '../../../../hooks/useFetchClient.mjs';
import { useQueryParams } from '../../../../hooks/useQueryParams.mjs';
import { useRBAC } from '../../../../hooks/useRBAC.mjs';
import { selectAdminPermissions } from '../../../../selectors.mjs';
import { isFetchError } from '../../../../utils/getFetchClient.mjs';
import { RoleRow } from './components/RoleRow.mjs';

const ListPage = ()=>{
    const { formatMessage } = useIntl();
    const permissions = useTypedSelector(selectAdminPermissions);
    const { formatAPIError } = useAPIErrorHandler();
    const { toggleNotification } = useNotification();
    const [isWarningDeleteAllOpened, setIsWarningDeleteAllOpenend] = React.useState(false);
    const [{ query }] = useQueryParams();
    const { isLoading: isLoadingForPermissions, allowedActions: { canCreate, canDelete, canRead, canUpdate } } = useRBAC(permissions.settings?.roles);
    const { roles, refetch: refetchRoles } = useAdminRoles({
        filters: query?._q ? {
            name: {
                $containsi: query._q
            }
        } : undefined
    }, {
        refetchOnMountOrArgChange: true,
        skip: isLoadingForPermissions || !canRead
    });
    const navigate = useNavigate();
    const [{ roleToDelete }, dispatch] = React.useReducer(reducer, initialState);
    const { post } = useFetchClient();
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
            if (isFetchError(error)) {
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Roles'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Header, {
                primaryAction: canCreate ? /*#__PURE__*/ jsx(Button, {
                    onClick: handleNewRoleClick,
                    startIcon: /*#__PURE__*/ jsx(Plus, {}),
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
            canRead && /*#__PURE__*/ jsx(Layouts.Action, {
                startActions: /*#__PURE__*/ jsx(SearchInput, {
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
            canRead && /*#__PURE__*/ jsx(Layouts.Content, {
                children: /*#__PURE__*/ jsxs(Table, {
                    colCount: colCount,
                    rowCount: rowCount,
                    footer: canCreate ? /*#__PURE__*/ jsx(TFooter, {
                        cursor: "pointer",
                        onClick: handleNewRoleClick,
                        icon: /*#__PURE__*/ jsx(Plus, {}),
                        children: formatMessage({
                            id: 'Settings.roles.list.button.add',
                            defaultMessage: 'Add new role'
                        })
                    }) : null,
                    children: [
                        /*#__PURE__*/ jsx(Thead, {
                            children: /*#__PURE__*/ jsxs(Tr, {
                                "aria-rowindex": 1,
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
                        /*#__PURE__*/ jsx(Tbody, {
                            children: roles?.map((role, index)=>/*#__PURE__*/ jsx(RoleRow, {
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
                                            children: /*#__PURE__*/ jsx(Duplicate, {})
                                        },
                                        canUpdate && {
                                            onClick: ()=>navigate(role.id.toString()),
                                            label: formatMessage({
                                                id: 'app.utils.edit',
                                                defaultMessage: 'Edit'
                                            }),
                                            children: /*#__PURE__*/ jsx(Pencil, {})
                                        },
                                        canDelete && {
                                            onClick: handleClickDelete(role),
                                            label: formatMessage({
                                                id: 'global.delete',
                                                defaultMessage: 'Delete'
                                            }),
                                            children: /*#__PURE__*/ jsx(Trash, {})
                                        }
                                    ].filter(Boolean),
                                    rowIndex: index + 2,
                                    canUpdate: canUpdate
                                }, role.id))
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: isWarningDeleteAllOpened,
                onOpenChange: handleToggleModal,
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
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
const reducer = (state, action)=>produce(state, (draftState)=>{
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
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.roles.read);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(ListPage, {})
    });
};

export { ListPage, ProtectedListPage };
//# sourceMappingURL=ListPage.mjs.map
