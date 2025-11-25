import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Page, useAPIErrorHandler, useNotification, useRBAC, Form, BackButton, ConfirmDialog } from '@strapi/admin/strapi-admin';
import { useLicenseLimits } from '@strapi/admin/strapi-admin/ee';
import { Button, Flex, Dialog, Typography } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { generateNKeysBetween } from 'fractional-indexing';
import { useIntl } from 'react-intl';
import { useParams, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { LimitsModal } from '../../components/LimitsModal.mjs';
import { CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME, CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME } from '../../constants.mjs';
import { useTypedSelector } from '../../modules/hooks.mjs';
import { isBaseQueryError } from '../../utils/api.mjs';
import { DragLayerRendered, Header, Root } from './components/Layout.mjs';
import { Stages } from './components/Stages.mjs';
import { WorkflowAttributes } from './components/WorkflowAttributes.mjs';
import { useReviewWorkflows } from './hooks/useReviewWorkflows.mjs';

/* -------------------------------------------------------------------------------------------------
 * EditPage
 * -----------------------------------------------------------------------------------------------*/ const WORKFLOW_SCHEMA = yup.object({
    contentTypes: yup.array().of(yup.string()),
    name: yup.string().max(255, {
        id: 'review-workflows.validation.name.max-length',
        defaultMessage: 'Name can not be longer than 255 characters'
    }).required().nullable(),
    stages: yup.array().of(yup.object().shape({
        name: yup.string().nullable().required({
            id: 'review-workflows.validation.stage.name',
            defaultMessage: 'Name is required'
        }).max(255, {
            id: 'review-workflows.validation.stage.max-length',
            defaultMessage: 'Name can not be longer than 255 characters'
        }).test('unique-name', {
            id: 'review-workflows.validation.stage.duplicate',
            defaultMessage: 'Stage name must be unique'
        }, (stageName, context)=>{
            // @ts-expect-error it does exist.
            const { stages } = context.from[1].value;
            return stages.filter((stage)=>stage.name === stageName).length === 1;
        }),
        color: yup.string().nullable().required({
            id: 'review-workflows.validation.stage.color',
            defaultMessage: 'Color is required'
        }).matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/i),
        permissions: yup.array(yup.object({
            role: yup.number().strict().typeError({
                id: 'review-workflows.validation.stage.permissions.role.number',
                defaultMessage: 'Role must be of type number'
            }).required(),
            action: yup.string().required({
                id: 'review-workflows.validation.stage.permissions.action.required',
                defaultMessage: 'Action is a required argument'
            })
        })).strict()
    })).min(1),
    stageRequiredToPublish: yup.string().nullable()
});
const EditPage = ()=>{
    const { id = '' } = useParams();
    const isCreatingWorkflow = id === 'create';
    const { formatMessage } = useIntl();
    const { _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const navigate = useNavigate();
    const { toggleNotification } = useNotification();
    const { isLoading: isLoadingWorkflow, meta, workflows, error, update, create } = useReviewWorkflows();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions['settings']?.['review-workflows']);
    const { allowedActions: { canDelete, canUpdate, canCreate } } = useRBAC(permissions);
    const [savePrompts, setSavePrompts] = React.useState({});
    const { getFeature, isLoading: isLicenseLoading } = useLicenseLimits();
    const [showLimitModal, setShowLimitModal] = React.useState(null);
    const currentWorkflow = workflows?.find((workflow)=>workflow.id === parseInt(id, 10));
    const contentTypesFromOtherWorkflows = workflows?.filter((workflow)=>workflow.id !== parseInt(id, 10)).flatMap((workflow)=>workflow.contentTypes);
    const limits = getFeature('review-workflows');
    const numberOfWorkflows = limits?.[CHARGEBEE_WORKFLOW_ENTITLEMENT_NAME];
    const stagesPerWorkflow = limits?.[CHARGEBEE_STAGES_PER_WORKFLOW_ENTITLEMENT_NAME];
    const submitForm = async (data, helpers)=>{
        try {
            const { stageRequiredToPublish, ...rest } = data;
            const stageRequiredToPublishName = stageRequiredToPublish === '' ? null : rest.stages.find((stage)=>stage.id === Number(stageRequiredToPublish) || stage.__temp_key__ === stageRequiredToPublish)?.name;
            if (!isCreatingWorkflow) {
                const res = await update(id, {
                    ...rest,
                    // compare permissions of stages and only submit them if at least one has
                    // changed; this enables partial updates e.g. for users who don't have
                    // permissions to see roles
                    stages: rest.stages.map((stage)=>{
                        let hasUpdatedPermissions = true;
                        const serverStage = currentWorkflow?.stages?.find((serverStage)=>serverStage.id === stage?.id);
                        if (serverStage) {
                            hasUpdatedPermissions = serverStage.permissions?.length !== stage.permissions?.length || !serverStage.permissions?.every((serverPermission)=>!!stage.permissions?.find((permission)=>permission.role === serverPermission.role));
                        }
                        return {
                            ...stage,
                            permissions: hasUpdatedPermissions ? stage.permissions : undefined
                        };
                    }),
                    stageRequiredToPublishName
                });
                if ('error' in res && isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                    helpers.setErrors(formatValidationErrors(res.error));
                }
            } else {
                const res = await create({
                    ...rest,
                    stageRequiredToPublishName
                });
                if ('error' in res && isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                    helpers.setErrors(formatValidationErrors(res.error));
                } else if ('data' in res) {
                    navigate(`../${res.data.id}`, {
                        replace: true
                    });
                }
            }
        } catch (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
        setSavePrompts({});
    };
    const handleConfirmDeleteDialog = (data, helpers)=>async ()=>{
            await submitForm(data, helpers);
        };
    const handleConfirmClose = ()=>{
        setSavePrompts({});
    };
    const handleSubmit = async (data, helpers)=>{
        const isContentTypeReassignment = data.contentTypes.some((contentType)=>contentTypesFromOtherWorkflows?.includes(contentType));
        const hasDeletedServerStages = !isCreatingWorkflow && !currentWorkflow?.stages.every((stage)=>data.stages.some((newStage)=>newStage.id === stage.id));
        if (meta && numberOfWorkflows && meta?.workflowCount > parseInt(numberOfWorkflows, 10)) {
            /**
       * If the current license has a limit, check if the total count of workflows
       * exceeds that limit and display the limits modal instead of sending the
       * update, because it would throw an API error.
       */ setShowLimitModal('workflow');
        /**
       * If the current license has a limit, check if the total count of stages
       * exceeds that limit and display the limits modal instead of sending the
       * update, because it would throw an API error.
       */ } else if (data.stages && stagesPerWorkflow && data.stages.length > parseInt(stagesPerWorkflow, 10)) {
            setShowLimitModal('stage');
        } else if (hasDeletedServerStages || isContentTypeReassignment) {
            if (hasDeletedServerStages) {
                setSavePrompts((prev)=>({
                        ...prev,
                        hasDeletedServerStages: true
                    }));
            }
            if (isContentTypeReassignment) {
                setSavePrompts((prev)=>({
                        ...prev,
                        hasReassignedContentTypes: true
                    }));
            }
        } else {
            await submitForm(data, helpers);
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
        if (!isLoadingWorkflow && !isLicenseLoading) {
            if (meta && numberOfWorkflows && meta?.workflowCount > parseInt(numberOfWorkflows, 10)) {
                setShowLimitModal('workflow');
            } else if (currentWorkflow && currentWorkflow.stages && stagesPerWorkflow && currentWorkflow.stages.length > parseInt(stagesPerWorkflow, 10)) {
                setShowLimitModal('stage');
            }
        }
    }, [
        currentWorkflow,
        isLicenseLoading,
        isLoadingWorkflow,
        limits,
        meta,
        numberOfWorkflows,
        stagesPerWorkflow
    ]);
    const initialValues = React.useMemo(()=>{
        if (isCreatingWorkflow || !currentWorkflow) {
            return {
                name: '',
                stages: [],
                contentTypes: [],
                stageRequiredToPublish: ''
            };
        } else {
            return {
                name: currentWorkflow.name,
                stages: addTmpKeysToStages(currentWorkflow.stages),
                contentTypes: currentWorkflow.contentTypes,
                stageRequiredToPublish: currentWorkflow.stageRequiredToPublish?.id.toString() ?? ''
            };
        }
    }, [
        currentWorkflow,
        isCreatingWorkflow
    ]);
    if (isLoadingWorkflow) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    if (error) {
        return /*#__PURE__*/ jsx(Page.Error, {});
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(DragLayerRendered, {}),
            /*#__PURE__*/ jsx(Form, {
                method: isCreatingWorkflow ? 'POST' : 'PUT',
                initialValues: initialValues,
                validationSchema: WORKFLOW_SCHEMA,
                onSubmit: handleSubmit,
                children: ({ modified, isSubmitting, values, setErrors })=>/*#__PURE__*/ jsxs(Fragment, {
                        children: [
                            /*#__PURE__*/ jsx(Header, {
                                navigationAction: /*#__PURE__*/ jsx(BackButton, {
                                    fallback: ".."
                                }),
                                primaryAction: canUpdate || canCreate ? /*#__PURE__*/ jsx(Button, {
                                    startIcon: /*#__PURE__*/ jsx(Check, {}),
                                    type: "submit",
                                    disabled: !modified || isSubmitting || values.stages.length === 0,
                                    // if the confirm dialog is open the loading state is on
                                    // the confirm button already
                                    loading: !Boolean(Object.keys(savePrompts).length > 0) && isSubmitting,
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                }) : null,
                                subtitle: formatMessage({
                                    id: 'review-workflows.page.subtitle',
                                    defaultMessage: '{count, plural, one {# stage} other {# stages}}'
                                }, {
                                    count: currentWorkflow?.stages?.length ?? 0
                                }),
                                title: currentWorkflow?.name || formatMessage({
                                    id: 'Settings.review-workflows.create.page.title',
                                    defaultMessage: 'Create Review Workflow'
                                })
                            }),
                            /*#__PURE__*/ jsx(Root, {
                                children: /*#__PURE__*/ jsxs(Flex, {
                                    alignItems: "stretch",
                                    direction: "column",
                                    gap: 7,
                                    children: [
                                        /*#__PURE__*/ jsx(WorkflowAttributes, {
                                            canUpdate: canUpdate || canCreate
                                        }),
                                        /*#__PURE__*/ jsx(Stages, {
                                            canDelete: canDelete,
                                            canUpdate: canUpdate || canCreate,
                                            isCreating: isCreatingWorkflow
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ jsx(Dialog.Root, {
                                open: Object.keys(savePrompts).length > 0,
                                onOpenChange: handleConfirmClose,
                                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                                    onConfirm: handleConfirmDeleteDialog(values, {
                                        setErrors
                                    }),
                                    children: /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        gap: 5,
                                        children: [
                                            savePrompts.hasDeletedServerStages && /*#__PURE__*/ jsx(Typography, {
                                                textAlign: "center",
                                                variant: "omega",
                                                children: formatMessage({
                                                    id: 'review-workflows.page.delete.confirm.stages.body',
                                                    defaultMessage: 'All entries assigned to deleted stages will be moved to the previous stage.'
                                                })
                                            }),
                                            savePrompts.hasReassignedContentTypes && /*#__PURE__*/ jsx(Typography, {
                                                textAlign: "center",
                                                variant: "omega",
                                                children: formatMessage({
                                                    id: 'review-workflows.page.delete.confirm.contentType.body',
                                                    defaultMessage: '{count} {count, plural, one {content-type} other {content-types}} {count, plural, one {is} other {are}} already mapped to {count, plural, one {another workflow} other {other workflows}}. If you save changes, {count, plural, one {this} other {these}} {count, plural, one {content-type} other {{count} content-types}} will no more be mapped to the {count, plural, one {another workflow} other {other workflows}} and all corresponding information will be removed.'
                                                }, {
                                                    count: contentTypesFromOtherWorkflows?.filter((contentType)=>values.contentTypes.includes(contentType)).length ?? 0
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Typography, {
                                                textAlign: "center",
                                                variant: "omega",
                                                children: formatMessage({
                                                    id: 'review-workflows.page.delete.confirm.confirm',
                                                    defaultMessage: 'Are you sure you want to save?'
                                                })
                                            })
                                        ]
                                    })
                                })
                            })
                        ]
                    })
            }),
            /*#__PURE__*/ jsxs(LimitsModal.Root, {
                open: showLimitModal === 'workflow',
                onOpenChange: ()=>setShowLimitModal(null),
                children: [
                    /*#__PURE__*/ jsx(LimitsModal.Title, {
                        children: formatMessage({
                            id: 'review-workflows.edit.page.workflows.limit.title',
                            defaultMessage: 'You’ve reached the limit of workflows in your plan'
                        })
                    }),
                    /*#__PURE__*/ jsx(LimitsModal.Body, {
                        children: formatMessage({
                            id: 'review-workflows.edit.page.workflows.limit.body',
                            defaultMessage: 'Delete a workflow or contact Sales to enable more workflows.'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(LimitsModal.Root, {
                open: showLimitModal === 'stage',
                onOpenChange: ()=>setShowLimitModal(null),
                children: [
                    /*#__PURE__*/ jsx(LimitsModal.Title, {
                        children: formatMessage({
                            id: 'review-workflows.edit.page.stages.limit.title',
                            defaultMessage: 'You have reached the limit of stages for this workflow in your plan'
                        })
                    }),
                    /*#__PURE__*/ jsx(LimitsModal.Body, {
                        children: formatMessage({
                            id: 'review-workflows.edit.page.stages.limit.body',
                            defaultMessage: 'Try deleting some stages or contact Sales to enable more stages.'
                        })
                    })
                ]
            })
        ]
    });
};
const addTmpKeysToStages = (data)=>{
    const keys = generateNKeysBetween(undefined, undefined, data.length);
    return data.map((datum, index)=>({
            ...datum,
            __temp_key__: keys[index]
        }));
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedEditPage
 * -----------------------------------------------------------------------------------------------*/ const ProtectedEditPage = ()=>{
    const permissions = useTypedSelector((state)=>{
        const { create = [], update = [], read = [] } = state.admin_app.permissions.settings?.['review-workflows'] ?? {};
        return [
            ...create,
            ...update,
            ...read
        ];
    });
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(EditPage, {})
    });
};

export { ProtectedEditPage };
//# sourceMappingURL=id.mjs.map
