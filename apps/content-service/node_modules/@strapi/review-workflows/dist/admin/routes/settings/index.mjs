import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking, useRBAC, Page, Table, ConfirmDialog } from '@strapi/admin/strapi-admin';
import { useLicenseLimits } from '@strapi/admin/strapi-admin/ee';
import { LinkButton, TFooter, Typography, Flex, IconButton, Dialog } from '@strapi/design-system';
import { Plus, Pencil, Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { LimitsModal } from '../../components/LimitsModal.mjs';
import { CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME } from '../../constants.mjs';
import { useTypedSelector } from '../../modules/hooks.mjs';
import { useGetContentTypesQuery } from '../../services/content-manager.mjs';
import { Header, Root } from './components/Layout.mjs';
import { useReviewWorkflows } from './hooks/useReviewWorkflows.mjs';

const ReviewWorkflowsListView = ()=>{
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
    const { trackUsage } = useTracking();
    const [workflowToDelete, setWorkflowToDelete] = React.useState(null);
    const [showLimitModal, setShowLimitModal] = React.useState(false);
    const { data, isLoading: isLoadingModels } = useGetContentTypesQuery();
    const { meta, workflows, isLoading, delete: deleteAction } = useReviewWorkflows();
    const { getFeature, isLoading: isLicenseLoading } = useLicenseLimits();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['review-workflows']);
    const { allowedActions: { canCreate, canRead, canUpdate, canDelete } } = useRBAC(permissions);
    const limits = getFeature('review-workflows');
    const numberOfWorkflows = limits?.[CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME];
    const handleDeleteWorkflow = (workflowId)=>{
        setWorkflowToDelete(workflowId);
    };
    const toggleConfirmDeleteDialog = ()=>{
        setWorkflowToDelete(null);
    };
    const handleConfirmDeleteDialog = async ()=>{
        if (!workflowToDelete) return;
        await deleteAction(workflowToDelete);
        setWorkflowToDelete(null);
    };
    const handleCreateClick = (event)=>{
        event.preventDefault();
        /**
     * If the current license has a workflow limit:
     * check if the total count of workflows exceeds that limit. If so,
     * prevent the navigation and show the limits overlay.
     *
     * If the current license does not have a limit (e.g. offline license):
     * allow the user to navigate to the create-view. In case they exceed the
     * current hard-limit of 200 they will see an error thrown by the API.
     */ if (numberOfWorkflows && meta && meta?.workflowCount >= parseInt(numberOfWorkflows, 10)) {
            event.preventDefault();
            setShowLimitModal(true);
        } else {
            navigate('create');
            trackUsage('willCreateWorkflow');
        }
    };
    /**
   * If the current license has a limit:
   * check if the total count of workflows or stages exceeds that limit and display
   * the limits modal on page load. It can be closed by the user, but the
   * API will throw an error in case they try to create a new workflow or update the
   * stages.
   *
   * If the current license does not have a limit (e.g. offline license):
   * do nothing (for now). In case they are trying to create the 201st workflow/ stage
   * the API will throw an error.
   *
   */ React.useEffect(()=>{
        if (!isLoading && !isLicenseLoading) {
            if (numberOfWorkflows && meta && meta?.workflowCount > parseInt(numberOfWorkflows, 10)) {
                setShowLimitModal(true);
            }
        }
    }, [
        isLicenseLoading,
        isLoading,
        meta,
        meta?.workflowCount,
        numberOfWorkflows
    ]);
    const headers = [
        {
            label: formatMessage({
                id: 'Settings.review-workflows.list.page.list.column.name.title',
                defaultMessage: 'Name'
            }),
            name: 'name'
        },
        {
            label: formatMessage({
                id: 'Settings.review-workflows.list.page.list.column.stages.title',
                defaultMessage: 'Stages'
            }),
            name: 'stages'
        },
        {
            label: formatMessage({
                id: 'Settings.review-workflows.list.page.list.column.contentTypes.title',
                defaultMessage: 'Content Types'
            }),
            name: 'content-types'
        }
    ];
    if (isLoading || isLoadingModels) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    const contentTypes = Object.values(data ?? {}).reduce((acc, curr)=>{
        acc.push(...curr);
        return acc;
    }, []);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Header, {
                primaryAction: canCreate ? /*#__PURE__*/ jsx(LinkButton, {
                    startIcon: /*#__PURE__*/ jsx(Plus, {}),
                    size: "S",
                    tag: NavLink,
                    to: "create",
                    onClick: handleCreateClick,
                    children: formatMessage({
                        id: 'Settings.review-workflows.list.page.create',
                        defaultMessage: 'Create new workflow'
                    })
                }) : null,
                subtitle: formatMessage({
                    id: 'Settings.review-workflows.list.page.subtitle',
                    defaultMessage: 'Manage your content review process'
                }),
                title: formatMessage({
                    id: 'Settings.review-workflows.list.page.title',
                    defaultMessage: 'Review Workflows'
                })
            }),
            /*#__PURE__*/ jsxs(Root, {
                children: [
                    /*#__PURE__*/ jsx(Table.Root, {
                        isLoading: isLoading,
                        rows: workflows,
                        footer: canCreate ? /*#__PURE__*/ jsx(TFooter, {
                            cursor: "pointer",
                            icon: /*#__PURE__*/ jsx(Plus, {}),
                            onClick: handleCreateClick,
                            children: formatMessage({
                                id: 'Settings.review-workflows.list.page.create',
                                defaultMessage: 'Create new workflow'
                            })
                        }) : null,
                        headers: headers,
                        children: /*#__PURE__*/ jsxs(Table.Content, {
                            children: [
                                /*#__PURE__*/ jsx(Table.Head, {
                                    children: headers.map((head)=>/*#__PURE__*/ jsx(Table.HeaderCell, {
                                            ...head
                                        }, head.name))
                                }),
                                /*#__PURE__*/ jsx(Table.Body, {
                                    children: workflows.map((workflow)=>/*#__PURE__*/ jsxs(Table.Row, {
                                            onClick: ()=>{
                                                navigate(`${workflow.id}`);
                                            },
                                            children: [
                                                /*#__PURE__*/ jsx(Table.Cell, {
                                                    width: "25rem",
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        textColor: "neutral800",
                                                        fontWeight: "bold",
                                                        ellipsis: true,
                                                        children: workflow.name
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Table.Cell, {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        textColor: "neutral800",
                                                        children: workflow.stages.length
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Table.Cell, {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        textColor: "neutral800",
                                                        children: workflow.contentTypes.map((uid)=>{
                                                            const contentType = contentTypes.find((contentType)=>contentType.uid === uid);
                                                            return contentType?.info.displayName ?? '';
                                                        }).join(', ')
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Table.Cell, {
                                                    children: /*#__PURE__*/ jsxs(Flex, {
                                                        alignItems: "center",
                                                        justifyContent: "end",
                                                        children: [
                                                            canRead || canUpdate ? /*#__PURE__*/ jsx(IconButton, {
                                                                tag: Link,
                                                                to: workflow.id.toString(),
                                                                label: formatMessage({
                                                                    id: 'Settings.review-workflows.list.page.list.column.actions.edit.label',
                                                                    defaultMessage: 'Edit {name}'
                                                                }, {
                                                                    name: workflow.name
                                                                }),
                                                                variant: "ghost",
                                                                children: /*#__PURE__*/ jsx(Pencil, {})
                                                            }) : null,
                                                            workflows.length > 1 && canDelete ? /*#__PURE__*/ jsx(IconButton, {
                                                                withTooltip: false,
                                                                label: formatMessage({
                                                                    id: 'Settings.review-workflows.list.page.list.column.actions.delete.label',
                                                                    defaultMessage: 'Delete {name}'
                                                                }, {
                                                                    name: 'Default workflow'
                                                                }),
                                                                variant: "ghost",
                                                                onClick: (e)=>{
                                                                    e.stopPropagation();
                                                                    handleDeleteWorkflow(String(workflow.id));
                                                                },
                                                                children: /*#__PURE__*/ jsx(Trash, {})
                                                            }) : null
                                                        ]
                                                    })
                                                })
                                            ]
                                        }, workflow.id))
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsx(Dialog.Root, {
                        open: !!workflowToDelete,
                        onOpenChange: toggleConfirmDeleteDialog,
                        children: /*#__PURE__*/ jsx(ConfirmDialog, {
                            onConfirm: handleConfirmDeleteDialog,
                            children: formatMessage({
                                id: 'Settings.review-workflows.list.page.delete.confirm.body',
                                defaultMessage: 'If you remove this worfklow, all stage-related information will be removed for this content-type. Are you sure you want to remove it?'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxs(LimitsModal.Root, {
                        open: showLimitModal,
                        onOpenChange: ()=>setShowLimitModal(false),
                        children: [
                            /*#__PURE__*/ jsx(LimitsModal.Title, {
                                children: formatMessage({
                                    id: 'Settings.review-workflows.list.page.workflows.limit.title',
                                    defaultMessage: 'You’ve reached the limit of workflows in your plan'
                                })
                            }),
                            /*#__PURE__*/ jsx(LimitsModal.Body, {
                                children: formatMessage({
                                    id: 'Settings.review-workflows.list.page.workflows.limit.body',
                                    defaultMessage: 'Delete a workflow or contact Sales to enable more workflows.'
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
const ProtectedListPage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['review-workflows']?.main);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(ReviewWorkflowsListView, {})
    });
};

export { ProtectedListPage, ReviewWorkflowsListView };
//# sourceMappingURL=index.mjs.map
