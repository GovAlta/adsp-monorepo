import { jsxs, jsx } from 'react/jsx-runtime';
import { InputRenderer, useForm, useField } from '@strapi/admin/strapi-admin';
import { MultiSelectOption, Typography, Grid, useCollator, Field, MultiSelect, MultiSelectGroup, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useGetContentTypesQuery } from '../../../services/content-manager.mjs';
import { useReviewWorkflows } from '../hooks/useReviewWorkflows.mjs';

const WorkflowAttributes = ({ canUpdate = true })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Grid.Root, {
        background: "neutral0",
        hasRadius: true,
        gap: 4,
        padding: 6,
        shadow: "tableShadow",
        children: [
            /*#__PURE__*/ jsx(Grid.Item, {
                col: 6,
                direction: "column",
                alignItems: "stretch",
                children: /*#__PURE__*/ jsx(InputRenderer, {
                    disabled: !canUpdate,
                    label: formatMessage({
                        id: 'Settings.review-workflows.workflow.name.label',
                        defaultMessage: 'Workflow Name'
                    }),
                    name: "name",
                    required: true,
                    type: "string"
                })
            }),
            /*#__PURE__*/ jsx(Grid.Item, {
                col: 6,
                direction: "column",
                alignItems: "stretch",
                children: /*#__PURE__*/ jsx(ContentTypesSelector, {
                    disabled: !canUpdate
                })
            }),
            /*#__PURE__*/ jsx(Grid.Item, {
                col: 6,
                direction: "column",
                alignItems: "stretch",
                children: /*#__PURE__*/ jsx(StageSelector, {
                    disabled: !canUpdate
                })
            })
        ]
    });
};
const ContentTypesSelector = ({ disabled })=>{
    const { formatMessage, locale } = useIntl();
    const { data: contentTypes, isLoading } = useGetContentTypesQuery();
    const { workflows } = useReviewWorkflows();
    const currentWorkflow = useForm('ContentTypesSelector', (state)=>state.values);
    const { error, value, onChange } = useField('contentTypes');
    const formatter = useCollator(locale, {
        sensitivity: 'base'
    });
    const isDisabled = disabled || isLoading || !contentTypes || contentTypes.collectionType.length === 0 && contentTypes.singleType.length === 0;
    const collectionTypes = (contentTypes?.collectionType ?? []).toSorted((a, b)=>formatter.compare(a.info.displayName, b.info.displayName)).map((contentType)=>({
            label: contentType.info.displayName,
            value: contentType.uid
        }));
    const singleTypes = (contentTypes?.singleType ?? []).map((contentType)=>({
            label: contentType.info.displayName,
            value: contentType.uid
        }));
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: error,
        name: 'contentTypes',
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: 'Settings.review-workflows.workflow.contentTypes.label',
                    defaultMessage: 'Associated to'
                })
            }),
            /*#__PURE__*/ jsx(MultiSelect, {
                customizeContent: (value)=>formatMessage({
                        id: 'Settings.review-workflows.workflow.contentTypes.displayValue',
                        defaultMessage: '{count} {count, plural, one {content type} other {content types}} selected'
                    }, {
                        count: value?.length
                    }),
                disabled: isDisabled,
                onChange: (values)=>{
                    onChange('contentTypes', values);
                },
                value: value,
                placeholder: formatMessage({
                    id: 'Settings.review-workflows.workflow.contentTypes.placeholder',
                    defaultMessage: 'Select'
                }),
                children: [
                    ...collectionTypes.length > 0 ? [
                        {
                            label: formatMessage({
                                id: 'Settings.review-workflows.workflow.contentTypes.collectionTypes.label',
                                defaultMessage: 'Collection Types'
                            }),
                            children: collectionTypes
                        }
                    ] : [],
                    ...singleTypes.length > 0 ? [
                        {
                            label: formatMessage({
                                id: 'Settings.review-workflows.workflow.contentTypes.singleTypes.label',
                                defaultMessage: 'Single Types'
                            }),
                            children: singleTypes
                        }
                    ] : []
                ].map((opt)=>{
                    return /*#__PURE__*/ jsx(MultiSelectGroup, {
                        label: opt.label,
                        values: opt.children.map((child)=>child.value.toString()),
                        children: opt.children.map((child)=>{
                            const { name: assignedWorkflowName } = workflows?.find((workflow)=>(currentWorkflow && workflow.id !== currentWorkflow.id || !currentWorkflow) && workflow.contentTypes.includes(child.value)) ?? {};
                            return /*#__PURE__*/ jsx(NestedOption, {
                                value: child.value,
                                children: /*#__PURE__*/ jsx(Typography, {
                                    children: // @ts-expect-error - formatMessage options doesn't expect to be a React component but that's what we need actually for the <i> and <em> components
                                    formatMessage({
                                        id: 'Settings.review-workflows.workflow.contentTypes.assigned.notice',
                                        defaultMessage: '{label} {name, select, undefined {} other {<i>(assigned to <em>{name}</em> workflow)</i>}}'
                                    }, {
                                        label: child.label,
                                        name: assignedWorkflowName,
                                        em: (...children)=>/*#__PURE__*/ jsx(Typography, {
                                                tag: "em",
                                                fontWeight: "bold",
                                                children: children
                                            }),
                                        i: (...children)=>/*#__PURE__*/ jsx(ContentTypeTakeNotice, {
                                                children: children
                                            })
                                    })
                                })
                            }, child.value);
                        })
                    }, opt.label);
                })
            })
        ]
    });
};
const NestedOption = styled(MultiSelectOption)`
  padding-left: ${({ theme })=>theme.spaces[7]};
`;
const ContentTypeTakeNotice = styled(Typography)`
  font-style: italic;
`;
const StageSelector = ({ disabled })=>{
    const { value: stages = [] } = useField('stages');
    const { formatMessage } = useIntl();
    const { error, value, onChange } = useField('stageRequiredToPublish');
    // stages with empty names are not valid, so we avoid them from being used to avoid errors
    const validStages = stages.filter((stage)=>stage.name);
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: error,
        name: "stageRequiredToPublish",
        hint: formatMessage({
            id: 'settings.review-workflows.workflow.stageRequiredToPublish.hint',
            defaultMessage: 'Prevents entries from being published if they are not at the required stage.'
        }),
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: 'settings.review-workflows.workflow.stageRequiredToPublish.label',
                    defaultMessage: 'Required stage for publishing'
                })
            }),
            /*#__PURE__*/ jsxs(SingleSelect, {
                disabled: disabled,
                onChange: (value)=>{
                    onChange('stageRequiredToPublish', value);
                },
                value: value,
                children: [
                    /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: '',
                        children: formatMessage({
                            id: 'settings.review-workflows.workflow.stageRequiredToPublish.any',
                            defaultMessage: 'Any stage'
                        })
                    }),
                    validStages.map((stage, i)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                            value: stage.id?.toString() || stage.__temp_key__,
                            children: stage.name
                        }, `requiredToPublishStage-${stage.id || stage.__temp_key__}`))
                ]
            }),
            /*#__PURE__*/ jsx(Field.Hint, {})
        ]
    });
};

export { WorkflowAttributes };
//# sourceMappingURL=WorkflowAttributes.mjs.map
