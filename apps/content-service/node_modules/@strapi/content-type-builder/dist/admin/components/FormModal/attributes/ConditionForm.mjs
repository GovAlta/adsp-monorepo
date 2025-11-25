import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useState } from 'react';
import { ConfirmDialog, createRulesEngine } from '@strapi/admin/strapi-admin';
import { Box, Flex, Typography, Dialog, IconButton, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { AttributeIcon } from '../../AttributeIcon.mjs';
import { getTrad } from '../../../utils/getTrad.mjs';
import { ApplyConditionButton } from '../../ApplyConditionButton.mjs';

const SmallAttributeIcon = styled(AttributeIcon)`
  width: 16px !important;
  height: 16px !important;
  svg {
    width: 16px !important;
    height: 16px !important;
  }
`;
const convertFromJsonLogic = (jsonLogic)=>{
    if (!jsonLogic?.visible) {
        return {
            dependsOn: '',
            operator: 'is',
            value: '',
            action: 'show'
        };
    }
    const [[operator, conditions]] = Object.entries(jsonLogic.visible);
    const [fieldVar, value] = conditions;
    // Assume 'visible' implies 'show' for now; adjust if backend uses 'hidden' key
    return {
        dependsOn: fieldVar.var,
        operator: operator === '==' ? 'is' : 'isNot',
        value: value,
        action: 'show'
    };
};
const convertToJsonLogic = (value)=>{
    if (!value.dependsOn) {
        return null;
    }
    const rulesEngine = createRulesEngine();
    const condition = {
        dependsOn: value.dependsOn,
        operator: value.operator,
        value: value.value
    };
    try {
        rulesEngine.validate(condition);
        // Determine JSON Logic operator based on operator and action
        const operator = value.operator === 'is' && value.action === 'show' || value.operator === 'isNot' && value.action === 'hide' ? '==' : '!=';
        return {
            visible: {
                [operator]: [
                    {
                        var: value.dependsOn
                    },
                    value.value
                ]
            }
        };
    } catch (error) {
        return null;
    }
};
const ConditionForm = ({ name, value, onChange, onDelete, attributeName, conditionFields = [] })=>{
    const { formatMessage } = useIntl();
    const [localValue, setLocalValue] = React.useState(convertFromJsonLogic(value));
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const hasCondition = Boolean(value?.visible);
    // Add safety check for conditionFields
    if (!Array.isArray(conditionFields)) {
        conditionFields = [];
    }
    const selectedField = conditionFields.find((field)=>field.name === localValue.dependsOn);
    const isEnumField = selectedField?.type === 'enumeration';
    // Helper to update localValue and propagate JSON Logic
    const updateCondition = (updatedValue)=>{
        setLocalValue(updatedValue);
        const rulesEngine = createRulesEngine();
        const condition = {
            dependsOn: updatedValue.dependsOn,
            operator: updatedValue.operator,
            value: updatedValue.value
        };
        try {
            rulesEngine.validate(condition);
            const operator = updatedValue.operator === 'is' && updatedValue.action === 'show' || updatedValue.operator === 'isNot' && updatedValue.action === 'hide' ? '==' : '!=';
            const jsonLogic = updatedValue.dependsOn ? {
                visible: {
                    [operator]: [
                        {
                            var: updatedValue.dependsOn
                        },
                        updatedValue.value
                    ]
                }
            } : null;
            if (jsonLogic) {
                onChange({
                    target: {
                        name,
                        value: jsonLogic
                    }
                });
            }
        } catch  {
        // Optionally, show an error to the user
        }
    };
    const handleApplyCondition = ()=>{
        const initialValue = {
            dependsOn: '',
            operator: 'is',
            value: '',
            action: 'show'
        };
        setLocalValue(initialValue);
        onChange({
            target: {
                name,
                value: convertToJsonLogic(initialValue)
            }
        });
    };
    const handleDelete = ()=>{
        setLocalValue({
            dependsOn: '',
            operator: 'is',
            value: '',
            action: 'show'
        });
        onChange({
            target: {
                name,
                value: null
            }
        });
        onDelete();
        setShowConfirmDialog(false);
    };
    const handleFieldChange = (fieldName)=>{
        const newValue = fieldName?.toString() || '';
        const field = conditionFields.find((f)=>f.name === newValue);
        const isNewFieldEnum = field?.type === 'enumeration';
        const updatedValue = {
            ...localValue,
            dependsOn: newValue,
            value: newValue ? isNewFieldEnum ? '' : false : localValue.value
        };
        updateCondition(updatedValue);
    };
    const handleOperatorChange = (operator)=>{
        const newValue = operator?.toString() || 'is';
        const updatedValue = {
            ...localValue,
            operator: newValue
        };
        updateCondition(updatedValue);
    };
    const handleValueChange = (newValue)=>{
        const value = isEnumField ? newValue?.toString() : newValue?.toString() === 'true';
        const updatedValue = {
            ...localValue,
            value
        };
        updateCondition(updatedValue);
    };
    const handleActionChange = (action)=>{
        const newValue = action?.toString() || 'show';
        const updatedValue = {
            ...localValue,
            action: newValue
        };
        updateCondition(updatedValue);
    };
    if (!hasCondition) {
        return /*#__PURE__*/ jsx(Box, {
            padding: 4,
            margin: 4,
            hasRadius: true,
            background: "neutral0",
            borderColor: "neutral200",
            children: /*#__PURE__*/ jsx(ApplyConditionButton, {
                onClick: handleApplyCondition
            })
        });
    }
    return /*#__PURE__*/ jsx(Box, {
        marginTop: 2,
        children: /*#__PURE__*/ jsxs(Box, {
            background: "neutral0",
            hasRadius: true,
            borderColor: "neutral200",
            borderWidth: 0.5,
            borderStyle: "solid",
            children: [
                /*#__PURE__*/ jsxs(Flex, {
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 4,
                    children: [
                        /*#__PURE__*/ jsx(Typography, {
                            variant: "sigma",
                            textColor: "neutral800",
                            children: formatMessage({
                                id: getTrad('form.attribute.condition.title'),
                                defaultMessage: 'Condition for {name}'
                            }, {
                                name: /*#__PURE__*/ jsx("strong", {
                                    children: attributeName
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxs(Dialog.Root, {
                            open: showConfirmDialog,
                            onOpenChange: setShowConfirmDialog,
                            children: [
                                /*#__PURE__*/ jsx(Dialog.Trigger, {
                                    children: /*#__PURE__*/ jsx(IconButton, {
                                        label: "Delete",
                                        children: /*#__PURE__*/ jsx(Trash, {})
                                    })
                                }),
                                /*#__PURE__*/ jsx(ConfirmDialog, {
                                    onConfirm: handleDelete,
                                    children: formatMessage({
                                        id: getTrad('popUpWarning.bodyMessage.delete-condition'),
                                        defaultMessage: 'Are you sure you want to delete this condition?'
                                    })
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsxs(Box, {
                    background: "neutral100",
                    padding: 4,
                    children: [
                        /*#__PURE__*/ jsx(Box, {
                            paddingBottom: 2,
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                style: {
                                    textTransform: 'uppercase',
                                    letterSpacing: 1
                                },
                                children: formatMessage({
                                    id: getTrad('form.attribute.condition.if'),
                                    defaultMessage: 'IF'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxs(Flex, {
                            gap: 4,
                            children: [
                                /*#__PURE__*/ jsx(Box, {
                                    minWidth: 0,
                                    flex: 1,
                                    children: /*#__PURE__*/ jsx(Field.Root, {
                                        name: `${name}.field`,
                                        children: /*#__PURE__*/ jsx(SingleSelect, {
                                            value: localValue.dependsOn,
                                            onChange: handleFieldChange,
                                            placeholder: formatMessage({
                                                id: getTrad('form.attribute.condition.field'),
                                                defaultMessage: 'field'
                                            }),
                                            children: conditionFields.map((field)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                                    value: field.name,
                                                    children: /*#__PURE__*/ jsxs(Flex, {
                                                        gap: 2,
                                                        alignItems: "center",
                                                        children: [
                                                            /*#__PURE__*/ jsx(SmallAttributeIcon, {
                                                                type: field.type
                                                            }),
                                                            /*#__PURE__*/ jsx("span", {
                                                                children: field.name
                                                            })
                                                        ]
                                                    })
                                                }, field.name))
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Box, {
                                    minWidth: 0,
                                    flex: 1,
                                    children: /*#__PURE__*/ jsx(Field.Root, {
                                        name: `${name}.operator`,
                                        children: /*#__PURE__*/ jsxs(SingleSelect, {
                                            value: localValue.operator,
                                            onChange: handleOperatorChange,
                                            disabled: !localValue.dependsOn,
                                            placeholder: formatMessage({
                                                id: getTrad('form.attribute.condition.operator'),
                                                defaultMessage: 'condition'
                                            }),
                                            children: [
                                                /*#__PURE__*/ jsx(SingleSelectOption, {
                                                    value: "is",
                                                    children: formatMessage({
                                                        id: getTrad('form.attribute.condition.operator.is'),
                                                        defaultMessage: 'is'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(SingleSelectOption, {
                                                    value: "isNot",
                                                    children: formatMessage({
                                                        id: getTrad('form.attribute.condition.operator.isNot'),
                                                        defaultMessage: 'is not'
                                                    })
                                                })
                                            ]
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Box, {
                                    minWidth: 0,
                                    flex: 1,
                                    children: /*#__PURE__*/ jsx(Field.Root, {
                                        name: `${name}.value`,
                                        children: /*#__PURE__*/ jsx(SingleSelect, {
                                            value: localValue.value?.toString() || '',
                                            onChange: handleValueChange,
                                            disabled: !localValue.dependsOn,
                                            placeholder: formatMessage({
                                                id: getTrad('form.attribute.condition.value'),
                                                defaultMessage: 'value'
                                            }),
                                            children: isEnumField && selectedField?.enum ? selectedField.enum.map((enumValue)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                                    value: enumValue,
                                                    children: enumValue
                                                }, enumValue)) : /*#__PURE__*/ jsxs(Fragment, {
                                                children: [
                                                    /*#__PURE__*/ jsx(SingleSelectOption, {
                                                        value: "true",
                                                        children: formatMessage({
                                                            id: getTrad('form.attribute.condition.value.true'),
                                                            defaultMessage: 'true'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx(SingleSelectOption, {
                                                        value: "false",
                                                        children: formatMessage({
                                                            id: getTrad('form.attribute.condition.value.false'),
                                                            defaultMessage: 'false'
                                                        })
                                                    })
                                                ]
                                            })
                                        })
                                    })
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsxs(Box, {
                    background: "neutral100",
                    padding: 4,
                    children: [
                        /*#__PURE__*/ jsx(Box, {
                            paddingBottom: 4,
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                style: {
                                    textTransform: 'uppercase',
                                    letterSpacing: 1
                                },
                                children: formatMessage({
                                    id: getTrad('form.attribute.condition.then'),
                                    defaultMessage: 'THEN'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Box, {
                            paddingBottom: 4,
                            children: /*#__PURE__*/ jsx(Field.Root, {
                                name: `${name}.action`,
                                children: /*#__PURE__*/ jsxs(SingleSelect, {
                                    value: localValue.action,
                                    onChange: handleActionChange,
                                    placeholder: formatMessage({
                                        id: getTrad('form.attribute.condition.action'),
                                        defaultMessage: 'action'
                                    }),
                                    children: [
                                        /*#__PURE__*/ jsxs(SingleSelectOption, {
                                            value: "show",
                                            children: [
                                                "Show ",
                                                /*#__PURE__*/ jsx("span", {
                                                    style: {
                                                        fontWeight: 'bold'
                                                    },
                                                    children: attributeName || name
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsxs(SingleSelectOption, {
                                            value: "hide",
                                            children: [
                                                "Hide ",
                                                /*#__PURE__*/ jsx("span", {
                                                    style: {
                                                        fontWeight: 'bold'
                                                    },
                                                    children: attributeName || name
                                                })
                                            ]
                                        })
                                    ]
                                })
                            })
                        })
                    ]
                })
            ]
        })
    });
};

export { ConditionForm };
//# sourceMappingURL=ConditionForm.mjs.map
