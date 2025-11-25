'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var ee = require('@strapi/admin/strapi-admin/ee');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var LimitsModal = require('../../components/LimitsModal.js');
var constants = require('../../constants.js');
var hooks = require('../../modules/hooks.js');
var contentManager = require('../../services/content-manager.js');
var Layout = require('./components/Layout.js');
var useReviewWorkflows = require('./hooks/useReviewWorkflows.js');

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

const ReviewWorkflowsListView = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const { trackUsage } = strapiAdmin.useTracking();
    const [workflowToDelete, setWorkflowToDelete] = React__namespace.useState(null);
    const [showLimitModal, setShowLimitModal] = React__namespace.useState(false);
    const { data, isLoading: isLoadingModels } = contentManager.useGetContentTypesQuery();
    const { meta, workflows, isLoading, delete: deleteAction } = useReviewWorkflows.useReviewWorkflows();
    const { getFeature, isLoading: isLicenseLoading } = ee.useLicenseLimits();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['review-workflows']);
    const { allowedActions: { canCreate, canRead, canUpdate, canDelete } } = strapiAdmin.useRBAC(permissions);
    const limits = getFeature('review-workflows');
    const numberOfWorkflows = limits?.[constants.CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME];
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
   */ React__namespace.useEffect(()=>{
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
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    const contentTypes = Object.values(data ?? {}).reduce((acc, curr)=>{
        acc.push(...curr);
        return acc;
    }, []);
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Header, {
                primaryAction: canCreate ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                    size: "S",
                    tag: reactRouterDom.NavLink,
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
            /*#__PURE__*/ jsxRuntime.jsxs(Layout.Root, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Root, {
                        isLoading: isLoading,
                        rows: workflows,
                        footer: canCreate ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.TFooter, {
                            cursor: "pointer",
                            icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                            onClick: handleCreateClick,
                            children: formatMessage({
                                id: 'Settings.review-workflows.list.page.create',
                                defaultMessage: 'Create new workflow'
                            })
                        }) : null,
                        headers: headers,
                        children: /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Table.Content, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Head, {
                                    children: headers.map((head)=>/*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.HeaderCell, {
                                            ...head
                                        }, head.name))
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Body, {
                                    children: workflows.map((workflow)=>/*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Table.Row, {
                                            onClick: ()=>{
                                                navigate(`${workflow.id}`);
                                            },
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                                    width: "25rem",
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        textColor: "neutral800",
                                                        fontWeight: "bold",
                                                        ellipsis: true,
                                                        children: workflow.name
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        textColor: "neutral800",
                                                        children: workflow.stages.length
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        textColor: "neutral800",
                                                        children: workflow.contentTypes.map((uid)=>{
                                                            const contentType = contentTypes.find((contentType)=>contentType.uid === uid);
                                                            return contentType?.info.displayName ?? '';
                                                        }).join(', ')
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                        alignItems: "center",
                                                        justifyContent: "end",
                                                        children: [
                                                            canRead || canUpdate ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                                                tag: reactRouterDom.Link,
                                                                to: workflow.id.toString(),
                                                                label: formatMessage({
                                                                    id: 'Settings.review-workflows.list.page.list.column.actions.edit.label',
                                                                    defaultMessage: 'Edit {name}'
                                                                }, {
                                                                    name: workflow.name
                                                                }),
                                                                variant: "ghost",
                                                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                                            }) : null,
                                                            workflows.length > 1 && canDelete ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
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
                                                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
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
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                        open: !!workflowToDelete,
                        onOpenChange: toggleConfirmDeleteDialog,
                        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                            onConfirm: handleConfirmDeleteDialog,
                            children: formatMessage({
                                id: 'Settings.review-workflows.list.page.delete.confirm.body',
                                defaultMessage: 'If you remove this worfklow, all stage-related information will be removed for this content-type. Are you sure you want to remove it?'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(LimitsModal.LimitsModal.Root, {
                        open: showLimitModal,
                        onOpenChange: ()=>setShowLimitModal(false),
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(LimitsModal.LimitsModal.Title, {
                                children: formatMessage({
                                    id: 'Settings.review-workflows.list.page.workflows.limit.title',
                                    defaultMessage: 'You’ve reached the limit of workflows in your plan'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(LimitsModal.LimitsModal.Body, {
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
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['review-workflows']?.main);
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(ReviewWorkflowsListView, {})
    });
};

exports.ProtectedListPage = ProtectedListPage;
exports.ReviewWorkflowsListView = ReviewWorkflowsListView;
//# sourceMappingURL=index.js.map
