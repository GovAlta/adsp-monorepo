'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var ee = require('@strapi/admin/strapi-admin/ee');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var LimitsModal = require('../../../../../components/LimitsModal.js');
var constants$1 = require('../../../../../constants.js');
var contentManager = require('../../../../../services/content-manager.js');
var api = require('../../../../../utils/api.js');
var colors = require('../../../../../utils/colors.js');
var constants = require('./constants.js');

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

/* -------------------------------------------------------------------------------------------------
 * LimitModals
 * -----------------------------------------------------------------------------------------------*/ const WorkflowLimitModal = ({ open, onOpenChange })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(LimitsModal.LimitsModal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(LimitsModal.LimitsModal.Title, {
                children: formatMessage({
                    id: 'content-manager.reviewWorkflows.workflows.limit.title',
                    defaultMessage: 'You’ve reached the limit of workflows in your plan'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(LimitsModal.LimitsModal.Body, {
                children: formatMessage({
                    id: 'content-manager.reviewWorkflows.workflows.limit.body',
                    defaultMessage: 'Delete a workflow or contact Sales to enable more workflows.'
                })
            })
        ]
    });
};
const StageLimitModal = ({ open, onOpenChange })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(LimitsModal.LimitsModal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(LimitsModal.LimitsModal.Title, {
                children: formatMessage({
                    id: 'content-manager.reviewWorkflows.stages.limit.title',
                    defaultMessage: 'You have reached the limit of stages for this workflow in your plan'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(LimitsModal.LimitsModal.Body, {
                children: formatMessage({
                    id: 'content-manager.reviewWorkflows.stages.limit.body',
                    defaultMessage: 'Try deleting some stages or contact Sales to enable more stages.'
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * StageSelect
 * -----------------------------------------------------------------------------------------------*/ const Select = ({ stages, activeWorkflowStage, isLoading, ...props })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { themeColorName } = colors.getStageColorByHex(activeWorkflowStage?.color) ?? {};
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
        disabled: stages.length === 0,
        placeholder: formatMessage({
            id: 'content-manager.reviewWorkflows.assignee.placeholder',
            defaultMessage: 'Select…'
        }),
        startIcon: activeWorkflowStage && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            tag: "span",
            height: 2,
            background: activeWorkflowStage?.color,
            borderColor: themeColorName === 'neutral0' ? 'neutral150' : undefined,
            hasRadius: true,
            shrink: 0,
            width: 2,
            marginRight: "-3px"
        }),
        // @ts-expect-error – `customizeContent` is not correctly typed in the DS.
        customizeContent: ()=>{
            return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                tag: "span",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        textColor: "neutral800",
                        ellipsis: true,
                        lineHeight: "inherit",
                        children: activeWorkflowStage?.name ?? ''
                    }),
                    isLoading ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                        small: true,
                        style: {
                            display: 'flex'
                        },
                        "data-testid": "loader"
                    }) : null
                ]
            });
        },
        ...props,
        children: stages.map(({ id, color, name })=>{
            const { themeColorName } = colors.getStageColorByHex(color) ?? {};
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                startIcon: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    height: 2,
                    background: color,
                    borderColor: themeColorName === 'neutral0' ? 'neutral150' : undefined,
                    hasRadius: true,
                    shrink: 0,
                    width: 2
                }),
                value: id,
                textValue: name,
                children: name
            }, id);
        })
    });
};
const StageSelect = ({ isCompact })=>{
    const { collectionType = '', slug: model = '', id = '' } = reactRouterDom.useParams();
    const { formatMessage } = reactIntl.useIntl();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { toggleNotification } = strapiAdmin.useNotification();
    const [{ query }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>api.buildValidParams(query), [
        query
    ]);
    const { document, isLoading: isLoadingDocument } = strapiAdmin$1.unstable_useDocument({
        collectionType,
        model,
        documentId: id
    }, {
        skip: !id && collectionType !== 'single-types'
    });
    const { data, isLoading: isLoadingStages } = contentManager.useGetStagesQuery({
        slug: collectionType,
        model: model,
        // @ts-expect-error – `id` is not correctly typed in the DS.
        id: document?.documentId,
        params
    }, {
        skip: !document?.documentId
    });
    const { meta, stages = [] } = data ?? {};
    const { getFeature } = ee.useLicenseLimits();
    const [showLimitModal, setShowLimitModal] = React__namespace.useState(null);
    const limits = getFeature('review-workflows') ?? {};
    const activeWorkflowStage = document ? document[constants.STAGE_ATTRIBUTE_NAME] : null;
    const [updateStage, { error }] = contentManager.useUpdateStageMutation();
    const handleChange = async (stageId)=>{
        try {
            /**
       * If the current license has a limit:
       * check if the total count of workflows exceeds that limit and display
       * the limits modal.
       *
       * If the current license does not have a limit (e.g. offline license):
       * do nothing (for now).
       *
       */ if (limits?.[constants$1.CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME] && parseInt(limits[constants$1.CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME], 10) < (meta?.workflowCount ?? 0)) {
                setShowLimitModal('workflow');
            /**
         * If the current license has a limit:
         * check if the total count of stages exceeds that limit and display
         * the limits modal.
         *
         * If the current license does not have a limit (e.g. offline license):
         * do nothing (for now).
         *
         */ } else if (limits?.[constants$1.CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME] && parseInt(limits[constants$1.CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME], 10) < stages.length) {
                setShowLimitModal('stage');
            } else {
                if (document?.documentId) {
                    const res = await updateStage({
                        model,
                        id: document.documentId,
                        slug: collectionType,
                        params,
                        data: {
                            id: stageId
                        }
                    });
                    if ('data' in res) {
                        toggleNotification({
                            type: 'success',
                            message: formatMessage({
                                id: 'content-manager.reviewWorkflows.stage.notification.saved',
                                defaultMessage: 'Review stage updated'
                            })
                        });
                    }
                    if (isCompact && 'error' in res) {
                        toggleNotification({
                            type: 'danger',
                            message: formatAPIError(res.error)
                        });
                    }
                }
            }
        } catch (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'content-manager.reviewWorkflows.stage.notification.error',
                    defaultMessage: 'An error occurred while updating the review stage'
                })
            });
        }
    };
    const isLoading = isLoadingStages || isLoadingDocument;
    const reviewStageLabel = formatMessage({
        id: 'content-manager.reviewWorkflows.stage.label',
        defaultMessage: 'Review stage'
    });
    const reviewStageHint = !isLoading && stages.length === 0 && // TODO: Handle errors and hints
    formatMessage({
        id: 'content-manager.reviewWorkflows.stages.no-transition',
        defaultMessage: 'You don’t have the permission to update this stage.'
    });
    if (isCompact) {
        return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                    label: reviewStageHint,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                        name: constants.STAGE_ATTRIBUTE_NAME,
                        id: constants.STAGE_ATTRIBUTE_NAME,
                        children: /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                        children: reviewStageLabel
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Select, {
                                    stages: stages,
                                    activeWorkflowStage: activeWorkflowStage,
                                    isLoading: isLoading,
                                    size: "S",
                                    disabled: stages.length === 0,
                                    value: activeWorkflowStage?.id,
                                    onChange: handleChange,
                                    placeholder: formatMessage({
                                        id: 'content-manager.reviewWorkflows.assignee.placeholder',
                                        defaultMessage: 'Select…'
                                    })
                                })
                            ]
                        })
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(WorkflowLimitModal, {
                    open: showLimitModal === 'workflow',
                    onOpenChange: ()=>setShowLimitModal(null)
                }),
                /*#__PURE__*/ jsxRuntime.jsx(StageLimitModal, {
                    open: showLimitModal === 'stage',
                    onOpenChange: ()=>setShowLimitModal(null)
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                hint: reviewStageHint,
                error: error && formatAPIError(error) || undefined,
                name: constants.STAGE_ATTRIBUTE_NAME,
                id: constants.STAGE_ATTRIBUTE_NAME,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                        children: reviewStageLabel
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Select, {
                        stages: stages,
                        activeWorkflowStage: activeWorkflowStage,
                        isLoading: isLoading,
                        disabled: stages.length === 0,
                        value: activeWorkflowStage?.id,
                        onChange: handleChange,
                        placeholder: formatMessage({
                            id: 'content-manager.reviewWorkflows.assignee.placeholder',
                            defaultMessage: 'Select…'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(WorkflowLimitModal, {
                open: showLimitModal === 'workflow',
                onOpenChange: ()=>setShowLimitModal(null)
            }),
            /*#__PURE__*/ jsxRuntime.jsx(StageLimitModal, {
                open: showLimitModal === 'stage',
                onOpenChange: ()=>setShowLimitModal(null)
            })
        ]
    });
};

exports.StageSelect = StageSelect;
//# sourceMappingURL=StageSelect.js.map
