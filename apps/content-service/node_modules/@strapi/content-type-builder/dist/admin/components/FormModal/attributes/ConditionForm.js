'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var AttributeIcon = require('../../AttributeIcon.js');
var getTrad = require('../../../utils/getTrad.js');
var ApplyConditionButton = require('../../ApplyConditionButton.js');

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

const SmallAttributeIcon = styledComponents.styled(AttributeIcon.AttributeIcon)`
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
    const rulesEngine = strapiAdmin.createRulesEngine();
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
    const { formatMessage } = reactIntl.useIntl();
    const [localValue, setLocalValue] = React__namespace.useState(convertFromJsonLogic(value));
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
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
        const rulesEngine = strapiAdmin.createRulesEngine();
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
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            padding: 4,
            margin: 4,
            hasRadius: true,
            background: "neutral0",
            borderColor: "neutral200",
            children: /*#__PURE__*/ jsxRuntime.jsx(ApplyConditionButton.ApplyConditionButton, {
                onClick: handleApplyCondition
            })
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        marginTop: 2,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
            background: "neutral0",
            hasRadius: true,
            borderColor: "neutral200",
            borderWidth: 0.5,
            borderStyle: "solid",
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 4,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "sigma",
                            textColor: "neutral800",
                            children: formatMessage({
                                id: getTrad.getTrad('form.attribute.condition.title'),
                                defaultMessage: 'Condition for {name}'
                            }, {
                                name: /*#__PURE__*/ jsxRuntime.jsx("strong", {
                                    children: attributeName
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Root, {
                            open: showConfirmDialog,
                            onOpenChange: setShowConfirmDialog,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Trigger, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                        label: "Delete",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Trash, {})
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                                    onConfirm: handleDelete,
                                    children: formatMessage({
                                        id: getTrad.getTrad('popUpWarning.bodyMessage.delete-condition'),
                                        defaultMessage: 'Are you sure you want to delete this condition?'
                                    })
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                    background: "neutral100",
                    padding: 4,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingBottom: 2,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                style: {
                                    textTransform: 'uppercase',
                                    letterSpacing: 1
                                },
                                children: formatMessage({
                                    id: getTrad.getTrad('form.attribute.condition.if'),
                                    defaultMessage: 'IF'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            gap: 4,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    minWidth: 0,
                                    flex: 1,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                                        name: `${name}.field`,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                                            value: localValue.dependsOn,
                                            onChange: handleFieldChange,
                                            placeholder: formatMessage({
                                                id: getTrad.getTrad('form.attribute.condition.field'),
                                                defaultMessage: 'field'
                                            }),
                                            children: conditionFields.map((field)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                    value: field.name,
                                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                        gap: 2,
                                                        alignItems: "center",
                                                        children: [
                                                            /*#__PURE__*/ jsxRuntime.jsx(SmallAttributeIcon, {
                                                                type: field.type
                                                            }),
                                                            /*#__PURE__*/ jsxRuntime.jsx("span", {
                                                                children: field.name
                                                            })
                                                        ]
                                                    })
                                                }, field.name))
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    minWidth: 0,
                                    flex: 1,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                                        name: `${name}.operator`,
                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.SingleSelect, {
                                            value: localValue.operator,
                                            onChange: handleOperatorChange,
                                            disabled: !localValue.dependsOn,
                                            placeholder: formatMessage({
                                                id: getTrad.getTrad('form.attribute.condition.operator'),
                                                defaultMessage: 'condition'
                                            }),
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                    value: "is",
                                                    children: formatMessage({
                                                        id: getTrad.getTrad('form.attribute.condition.operator.is'),
                                                        defaultMessage: 'is'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                    value: "isNot",
                                                    children: formatMessage({
                                                        id: getTrad.getTrad('form.attribute.condition.operator.isNot'),
                                                        defaultMessage: 'is not'
                                                    })
                                                })
                                            ]
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    minWidth: 0,
                                    flex: 1,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                                        name: `${name}.value`,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                                            value: localValue.value?.toString() || '',
                                            onChange: handleValueChange,
                                            disabled: !localValue.dependsOn,
                                            placeholder: formatMessage({
                                                id: getTrad.getTrad('form.attribute.condition.value'),
                                                defaultMessage: 'value'
                                            }),
                                            children: isEnumField && selectedField?.enum ? selectedField.enum.map((enumValue)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                    value: enumValue,
                                                    children: enumValue
                                                }, enumValue)) : /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                        value: "true",
                                                        children: formatMessage({
                                                            id: getTrad.getTrad('form.attribute.condition.value.true'),
                                                            defaultMessage: 'true'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                        value: "false",
                                                        children: formatMessage({
                                                            id: getTrad.getTrad('form.attribute.condition.value.false'),
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
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                    background: "neutral100",
                    padding: 4,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingBottom: 4,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                style: {
                                    textTransform: 'uppercase',
                                    letterSpacing: 1
                                },
                                children: formatMessage({
                                    id: getTrad.getTrad('form.attribute.condition.then'),
                                    defaultMessage: 'THEN'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingBottom: 4,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                                name: `${name}.action`,
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.SingleSelect, {
                                    value: localValue.action,
                                    onChange: handleActionChange,
                                    placeholder: formatMessage({
                                        id: getTrad.getTrad('form.attribute.condition.action'),
                                        defaultMessage: 'action'
                                    }),
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.SingleSelectOption, {
                                            value: "show",
                                            children: [
                                                "Show ",
                                                /*#__PURE__*/ jsxRuntime.jsx("span", {
                                                    style: {
                                                        fontWeight: 'bold'
                                                    },
                                                    children: attributeName || name
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.SingleSelectOption, {
                                            value: "hide",
                                            children: [
                                                "Hide ",
                                                /*#__PURE__*/ jsxRuntime.jsx("span", {
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

exports.ConditionForm = ConditionForm;
//# sourceMappingURL=ConditionForm.js.map
