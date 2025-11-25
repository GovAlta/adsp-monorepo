import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotifyAT, LinkButton, Typography, Button, Table, TFooter, Thead, Tr, Th, Checkbox, VisuallyHidden, Tbody, Td, Flex, Switch, IconButton, EmptyStateLayout, Dialog } from '@strapi/design-system';
import { Plus, Trash, Pencil } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { useNavigate, NavLink } from 'react-router-dom';
import { ConfirmDialog } from '../../../../components/ConfirmDialog.mjs';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useRBAC } from '../../../../hooks/useRBAC.mjs';
import { useWebhooks } from './hooks/useWebhooks.mjs';

/* -------------------------------------------------------------------------------------------------
 * ListPage
 * -----------------------------------------------------------------------------------------------*/ const ListPage = ()=>{
    const [showModal, setShowModal] = React.useState(false);
    const [webhooksToDelete, setWebhooksToDelete] = React.useState([]);
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.webhooks);
    const { formatMessage } = useIntl();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { toggleNotification } = useNotification();
    const navigate = useNavigate();
    const { isLoading: isRBACLoading, allowedActions: { canCreate, canUpdate, canDelete } } = useRBAC(permissions);
    const { notifyStatus } = useNotifyAT();
    const { isLoading: isWebhooksLoading, webhooks, error: webhooksError, updateWebhook, deleteManyWebhooks } = useWebhooks();
    React.useEffect(()=>{
        if (webhooksError) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(webhooksError)
            });
            return;
        }
        if (webhooks) {
            notifyStatus(formatMessage({
                id: 'Settings.webhooks.list.loading.success',
                defaultMessage: 'Webhooks have been loaded'
            }));
        }
    }, [
        webhooks,
        webhooksError,
        toggleNotification,
        formatMessage,
        notifyStatus,
        formatAPIError
    ]);
    const enableWebhook = async (body)=>{
        try {
            const res = await updateWebhook(body);
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
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    const deleteWebhook = async (id)=>{
        try {
            const res = await deleteManyWebhooks({
                ids: [
                    id
                ]
            });
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
                return;
            }
            setWebhooksToDelete((prev)=>prev.filter((webhookId)=>webhookId !== id));
        } catch  {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    const confirmBulkDelete = async ()=>{
        try {
            const res = await deleteManyWebhooks({
                ids: webhooksToDelete
            });
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
                return;
            }
            setWebhooksToDelete([]);
        } catch  {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        } finally{
            setShowModal(false);
        }
    };
    const selectAllCheckbox = (selected)=>selected ? setWebhooksToDelete(webhooks?.map((webhook)=>webhook.id) ?? []) : setWebhooksToDelete([]);
    const selectOneCheckbox = (selected, id)=>selected ? setWebhooksToDelete((prev)=>[
                ...prev,
                id
            ]) : setWebhooksToDelete((prev)=>prev.filter((webhookId)=>webhookId !== id));
    const isLoading = isRBACLoading || isWebhooksLoading;
    const numberOfWebhooks = webhooks?.length ?? 0;
    const webhooksToDeleteLength = webhooksToDelete.length;
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Webhooks'
                })
            }),
            /*#__PURE__*/ jsxs(Page.Main, {
                "aria-busy": isLoading,
                children: [
                    /*#__PURE__*/ jsx(Layouts.Header, {
                        title: formatMessage({
                            id: 'Settings.webhooks.title',
                            defaultMessage: 'Webhooks'
                        }),
                        subtitle: formatMessage({
                            id: 'Settings.webhooks.list.description',
                            defaultMessage: 'Get POST changes notifications'
                        }),
                        primaryAction: canCreate && !isLoading && /*#__PURE__*/ jsx(LinkButton, {
                            tag: NavLink,
                            startIcon: /*#__PURE__*/ jsx(Plus, {}),
                            variant: "default",
                            to: "create",
                            size: "S",
                            children: formatMessage({
                                id: 'Settings.webhooks.list.button.add',
                                defaultMessage: 'Create new webhook'
                            })
                        })
                    }),
                    webhooksToDeleteLength > 0 && canDelete && /*#__PURE__*/ jsx(Layouts.Action, {
                        startActions: /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Typography, {
                                    variant: "epsilon",
                                    textColor: "neutral600",
                                    children: formatMessage({
                                        id: 'Settings.webhooks.to.delete',
                                        defaultMessage: '{webhooksToDeleteLength, plural, one {# webhook} other {# webhooks}} selected'
                                    }, {
                                        webhooksToDeleteLength
                                    })
                                }),
                                /*#__PURE__*/ jsx(Button, {
                                    onClick: ()=>setShowModal(true),
                                    startIcon: /*#__PURE__*/ jsx(Trash, {}),
                                    size: "L",
                                    variant: "danger-light",
                                    children: formatMessage({
                                        id: 'global.delete',
                                        defaultMessage: 'Delete'
                                    })
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsx(Layouts.Content, {
                        children: numberOfWebhooks > 0 ? /*#__PURE__*/ jsxs(Table, {
                            colCount: 5,
                            rowCount: numberOfWebhooks + 1,
                            footer: /*#__PURE__*/ jsx(TFooter, {
                                onClick: ()=>{
                                    if (canCreate) {
                                        navigate('create');
                                    }
                                },
                                icon: /*#__PURE__*/ jsx(Plus, {}),
                                children: formatMessage({
                                    id: 'Settings.webhooks.list.button.add',
                                    defaultMessage: 'Create new webhook'
                                })
                            }),
                            children: [
                                /*#__PURE__*/ jsx(Thead, {
                                    children: /*#__PURE__*/ jsxs(Tr, {
                                        children: [
                                            /*#__PURE__*/ jsx(Th, {
                                                children: /*#__PURE__*/ jsx(Checkbox, {
                                                    "aria-label": formatMessage({
                                                        id: 'global.select-all-entries',
                                                        defaultMessage: 'Select all entries'
                                                    }),
                                                    checked: webhooksToDeleteLength > 0 && webhooksToDeleteLength < numberOfWebhooks ? 'indeterminate' : webhooksToDeleteLength === numberOfWebhooks,
                                                    onCheckedChange: selectAllCheckbox
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Th, {
                                                width: "20%",
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
                                                width: "60%",
                                                children: /*#__PURE__*/ jsx(Typography, {
                                                    variant: "sigma",
                                                    textColor: "neutral600",
                                                    children: formatMessage({
                                                        id: 'Settings.webhooks.form.url',
                                                        defaultMessage: 'URL'
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Th, {
                                                width: "20%",
                                                children: /*#__PURE__*/ jsx(Typography, {
                                                    variant: "sigma",
                                                    textColor: "neutral600",
                                                    children: formatMessage({
                                                        id: 'Settings.webhooks.list.th.status',
                                                        defaultMessage: 'Status'
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Th, {
                                                children: /*#__PURE__*/ jsx(VisuallyHidden, {
                                                    children: formatMessage({
                                                        id: 'Settings.webhooks.list.th.actions',
                                                        defaultMessage: 'Actions'
                                                    })
                                                })
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ jsx(Tbody, {
                                    children: webhooks?.map((webhook)=>/*#__PURE__*/ jsxs(Tr, {
                                            onClick: ()=>{
                                                if (canUpdate) {
                                                    navigate(webhook.id);
                                                }
                                            },
                                            style: {
                                                cursor: canUpdate ? 'pointer' : 'default'
                                            },
                                            children: [
                                                /*#__PURE__*/ jsx(Td, {
                                                    onClick: (e)=>e.stopPropagation(),
                                                    children: /*#__PURE__*/ jsx(Checkbox, {
                                                        "aria-label": `${formatMessage({
                                                            id: 'global.select',
                                                            defaultMessage: 'Select'
                                                        })} ${webhook.name}`,
                                                        checked: webhooksToDelete?.includes(webhook.id),
                                                        onCheckedChange: (selected)=>selectOneCheckbox(!!selected, webhook.id),
                                                        name: "select"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Td, {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        fontWeight: "semiBold",
                                                        textColor: "neutral800",
                                                        children: webhook.name
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Td, {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        textColor: "neutral800",
                                                        children: webhook.url
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Td, {
                                                    onClick: (e)=>e.stopPropagation(),
                                                    children: /*#__PURE__*/ jsx(Flex, {
                                                        children: /*#__PURE__*/ jsx(Switch, {
                                                            onLabel: formatMessage({
                                                                id: 'global.enabled',
                                                                defaultMessage: 'Enabled'
                                                            }),
                                                            offLabel: formatMessage({
                                                                id: 'global.disabled',
                                                                defaultMessage: 'Disabled'
                                                            }),
                                                            "aria-label": `${webhook.name} ${formatMessage({
                                                                id: 'Settings.webhooks.list.th.status',
                                                                defaultMessage: 'Status'
                                                            })}`,
                                                            checked: webhook.isEnabled,
                                                            onCheckedChange: (enabled)=>{
                                                                enableWebhook({
                                                                    ...webhook,
                                                                    isEnabled: enabled
                                                                });
                                                            },
                                                            visibleLabels: true
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Td, {
                                                    children: /*#__PURE__*/ jsxs(Flex, {
                                                        gap: 1,
                                                        children: [
                                                            canUpdate && /*#__PURE__*/ jsx(IconButton, {
                                                                label: formatMessage({
                                                                    id: 'Settings.webhooks.events.update',
                                                                    defaultMessage: 'Update'
                                                                }),
                                                                variant: "ghost",
                                                                children: /*#__PURE__*/ jsx(Pencil, {})
                                                            }),
                                                            canDelete && /*#__PURE__*/ jsx(DeleteActionButton, {
                                                                onDelete: ()=>{
                                                                    deleteWebhook(webhook.id);
                                                                }
                                                            })
                                                        ]
                                                    })
                                                })
                                            ]
                                        }, webhook.id))
                                })
                            ]
                        }) : /*#__PURE__*/ jsx(EmptyStateLayout, {
                            icon: /*#__PURE__*/ jsx(EmptyDocuments, {
                                width: "160px"
                            }),
                            content: formatMessage({
                                id: 'Settings.webhooks.list.empty.description',
                                defaultMessage: 'No webhooks found'
                            }),
                            action: canCreate ? /*#__PURE__*/ jsx(LinkButton, {
                                variant: "secondary",
                                startIcon: /*#__PURE__*/ jsx(Plus, {}),
                                tag: NavLink,
                                to: "create",
                                children: formatMessage({
                                    id: 'Settings.webhooks.list.button.add',
                                    defaultMessage: 'Create new webhook'
                                })
                            }) : null
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: showModal,
                onOpenChange: setShowModal,
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                    onConfirm: confirmBulkDelete
                })
            })
        ]
    });
};
const DeleteActionButton = ({ onDelete })=>{
    const [showModal, setShowModal] = React.useState(false);
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(IconButton, {
                onClick: (e)=>{
                    e.stopPropagation();
                    setShowModal(true);
                },
                label: formatMessage({
                    id: 'Settings.webhooks.events.delete',
                    defaultMessage: 'Delete webhook'
                }),
                variant: "ghost",
                children: /*#__PURE__*/ jsx(Trash, {})
            }),
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: showModal,
                onOpenChange: setShowModal,
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                    onConfirm: (e)=>{
                        e?.stopPropagation();
                        onDelete();
                    }
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedListView
 * -----------------------------------------------------------------------------------------------*/ const ProtectedListPage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.webhooks.main);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(ListPage, {})
    });
};

export { ListPage, ProtectedListPage };
//# sourceMappingURL=ListPage.mjs.map
