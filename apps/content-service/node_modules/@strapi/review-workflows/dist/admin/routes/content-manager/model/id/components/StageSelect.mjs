import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useAPIErrorHandler, useNotification, useQueryParams } from '@strapi/admin/strapi-admin';
import { useLicenseLimits } from '@strapi/admin/strapi-admin/ee';
import { unstable_useDocument } from '@strapi/content-manager/strapi-admin';
import { Tooltip, Field, VisuallyHidden, SingleSelect, Flex, Typography, Loader, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { LimitsModal } from '../../../../../components/LimitsModal.mjs';
import { CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME, CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME } from '../../../../../constants.mjs';
import { useGetStagesQuery, useUpdateStageMutation } from '../../../../../services/content-manager.mjs';
import { buildValidParams } from '../../../../../utils/api.mjs';
import { getStageColorByHex } from '../../../../../utils/colors.mjs';
import { STAGE_ATTRIBUTE_NAME } from './constants.mjs';

/* -------------------------------------------------------------------------------------------------
 * LimitModals
 * -----------------------------------------------------------------------------------------------*/ const WorkflowLimitModal = ({ open, onOpenChange })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(LimitsModal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: [
            /*#__PURE__*/ jsx(LimitsModal.Title, {
                children: formatMessage({
                    id: 'content-manager.reviewWorkflows.workflows.limit.title',
                    defaultMessage: 'You’ve reached the limit of workflows in your plan'
                })
            }),
            /*#__PURE__*/ jsx(LimitsModal.Body, {
                children: formatMessage({
                    id: 'content-manager.reviewWorkflows.workflows.limit.body',
                    defaultMessage: 'Delete a workflow or contact Sales to enable more workflows.'
                })
            })
        ]
    });
};
const StageLimitModal = ({ open, onOpenChange })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(LimitsModal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: [
            /*#__PURE__*/ jsx(LimitsModal.Title, {
                children: formatMessage({
                    id: 'content-manager.reviewWorkflows.stages.limit.title',
                    defaultMessage: 'You have reached the limit of stages for this workflow in your plan'
                })
            }),
            /*#__PURE__*/ jsx(LimitsModal.Body, {
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
    const { formatMessage } = useIntl();
    const { themeColorName } = getStageColorByHex(activeWorkflowStage?.color) ?? {};
    return /*#__PURE__*/ jsx(SingleSelect, {
        disabled: stages.length === 0,
        placeholder: formatMessage({
            id: 'content-manager.reviewWorkflows.assignee.placeholder',
            defaultMessage: 'Select…'
        }),
        startIcon: activeWorkflowStage && /*#__PURE__*/ jsx(Flex, {
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
            return /*#__PURE__*/ jsxs(Flex, {
                tag: "span",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        textColor: "neutral800",
                        ellipsis: true,
                        lineHeight: "inherit",
                        children: activeWorkflowStage?.name ?? ''
                    }),
                    isLoading ? /*#__PURE__*/ jsx(Loader, {
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
            const { themeColorName } = getStageColorByHex(color) ?? {};
            return /*#__PURE__*/ jsx(SingleSelectOption, {
                startIcon: /*#__PURE__*/ jsx(Flex, {
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
    const { collectionType = '', slug: model = '', id = '' } = useParams();
    const { formatMessage } = useIntl();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { toggleNotification } = useNotification();
    const [{ query }] = useQueryParams();
    const params = React.useMemo(()=>buildValidParams(query), [
        query
    ]);
    const { document, isLoading: isLoadingDocument } = unstable_useDocument({
        collectionType,
        model,
        documentId: id
    }, {
        skip: !id && collectionType !== 'single-types'
    });
    const { data, isLoading: isLoadingStages } = useGetStagesQuery({
        slug: collectionType,
        model: model,
        // @ts-expect-error – `id` is not correctly typed in the DS.
        id: document?.documentId,
        params
    }, {
        skip: !document?.documentId
    });
    const { meta, stages = [] } = data ?? {};
    const { getFeature } = useLicenseLimits();
    const [showLimitModal, setShowLimitModal] = React.useState(null);
    const limits = getFeature('review-workflows') ?? {};
    const activeWorkflowStage = document ? document[STAGE_ATTRIBUTE_NAME] : null;
    const [updateStage, { error }] = useUpdateStageMutation();
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
       */ if (limits?.[CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME] && parseInt(limits[CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME], 10) < (meta?.workflowCount ?? 0)) {
                setShowLimitModal('workflow');
            /**
         * If the current license has a limit:
         * check if the total count of stages exceeds that limit and display
         * the limits modal.
         *
         * If the current license does not have a limit (e.g. offline license):
         * do nothing (for now).
         *
         */ } else if (limits?.[CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME] && parseInt(limits[CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME], 10) < stages.length) {
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
        return /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(Tooltip, {
                    label: reviewStageHint,
                    children: /*#__PURE__*/ jsx(Field.Root, {
                        name: STAGE_ATTRIBUTE_NAME,
                        id: STAGE_ATTRIBUTE_NAME,
                        children: /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(VisuallyHidden, {
                                    children: /*#__PURE__*/ jsx(Field.Label, {
                                        children: reviewStageLabel
                                    })
                                }),
                                /*#__PURE__*/ jsx(Select, {
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
                /*#__PURE__*/ jsx(WorkflowLimitModal, {
                    open: showLimitModal === 'workflow',
                    onOpenChange: ()=>setShowLimitModal(null)
                }),
                /*#__PURE__*/ jsx(StageLimitModal, {
                    open: showLimitModal === 'stage',
                    onOpenChange: ()=>setShowLimitModal(null)
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsxs(Field.Root, {
                hint: reviewStageHint,
                error: error && formatAPIError(error) || undefined,
                name: STAGE_ATTRIBUTE_NAME,
                id: STAGE_ATTRIBUTE_NAME,
                children: [
                    /*#__PURE__*/ jsx(Field.Label, {
                        children: reviewStageLabel
                    }),
                    /*#__PURE__*/ jsx(Select, {
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
                    /*#__PURE__*/ jsx(Field.Hint, {}),
                    /*#__PURE__*/ jsx(Field.Error, {})
                ]
            }),
            /*#__PURE__*/ jsx(WorkflowLimitModal, {
                open: showLimitModal === 'workflow',
                onOpenChange: ()=>setShowLimitModal(null)
            }),
            /*#__PURE__*/ jsx(StageLimitModal, {
                open: showLimitModal === 'stage',
                onOpenChange: ()=>setShowLimitModal(null)
            })
        ]
    });
};

export { StageSelect };
//# sourceMappingURL=StageSelect.mjs.map
