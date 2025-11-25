import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Field, TextInput, TimePicker, Textarea, SingleSelect, SingleSelectOption, NumberInput, DatePicker, DateTimePicker, Checkbox, Toggle, JSONInput } from '@strapi/design-system';
import { Eye, EyeStriked } from '@strapi/icons';
import formatISO from 'date-fns/formatISO';
import isEqual from 'lodash/isEqual';
import { useIntl } from 'react-intl';
import { parseDateValue } from '../utils/parseDateValue.mjs';
import { handleTimeChange, handleTimeChangeEvent } from '../utils/timeFormat.mjs';

const GenericInput = ({ autoComplete, customInputs, description, disabled, intlLabel, labelAction, error, name, onChange, onDelete, options = [], placeholder, required, step, type, value: defaultValue, isNullable, autoFocus, attribute, attributeName, conditionFields, ...rest })=>{
    const { formatMessage } = useIntl();
    // TODO: Workaround to get the field hint values if they exist on the type
    const getFieldHintValue = (attribute, key)=>{
        if (!attribute) return;
        if (key === 'minLength' && key in attribute) {
            return attribute[key];
        }
        if (key === 'maxLength' && key in attribute) {
            return attribute[key];
        }
        if (key === 'max' && key in attribute) {
            return attribute[key];
        }
        if (key === 'min' && key in attribute) {
            return attribute[key];
        }
    };
    const { hint } = useFieldHint({
        description,
        fieldSchema: {
            minLength: getFieldHintValue(attribute, 'minLength'),
            maxLength: getFieldHintValue(attribute, 'maxLength'),
            max: getFieldHintValue(attribute, 'max'),
            min: getFieldHintValue(attribute, 'min')
        },
        type: attribute?.type || type
    });
    const [showPassword, setShowPassword] = React.useState(false);
    const CustomInput = customInputs ? customInputs[type] : null;
    // the API always returns null, which throws an error in React,
    // therefore we cast this case to undefined
    const value = defaultValue ?? undefined;
    /*
   TODO: ideally we should pass in `defaultValue` and `value` for
   inputs, in order to make them controlled components. This variable
   acts as a fallback for now, to prevent React errors in devopment mode

   See: https://github.com/strapi/strapi/pull/12861
  */ const valueWithEmptyStringFallback = value ?? '';
    function getErrorMessage(error) {
        if (!error) {
            return null;
        }
        if (typeof error === 'string') {
            return formatMessage({
                id: error,
                defaultMessage: error
            });
        }
        const values = {
            ...error.values
        };
        return formatMessage({
            id: error.id,
            defaultMessage: error?.defaultMessage ?? error.id
        }, values);
    }
    const errorMessage = getErrorMessage(error) ?? undefined;
    if (CustomInput) {
        return /*#__PURE__*/ jsx(CustomInput, {
            ...rest,
            attribute: attribute,
            description: description,
            hint: hint,
            disabled: disabled,
            intlLabel: intlLabel,
            labelAction: labelAction,
            error: errorMessage || '',
            name: name,
            onChange: onChange,
            onDelete: onDelete,
            options: options,
            required: required,
            placeholder: placeholder,
            type: type,
            value: value,
            autoFocus: autoFocus,
            attributeName: attributeName,
            conditionFields: conditionFields
        });
    }
    const label = intlLabel.id ? formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage
    }, {
        ...intlLabel.values
    }) : name;
    const formattedPlaceholder = placeholder ? formatMessage({
        id: placeholder.id,
        defaultMessage: placeholder.defaultMessage
    }, {
        ...placeholder.values
    }) : '';
    const getComponent = ()=>{
        switch(type){
            case 'json':
                {
                    return /*#__PURE__*/ jsx(JSONInput, {
                        value: value,
                        disabled: disabled,
                        onChange: (json)=>{
                            // Default to null when the field is not required and there is no input value
                            const value = attribute && 'required' in attribute && !attribute?.required && !json.length ? null : json;
                            onChange({
                                target: {
                                    name,
                                    value
                                }
                            }, false);
                        },
                        minHeight: "25.2rem",
                        maxHeight: "50.4rem"
                    });
                }
            case 'bool':
                {
                    return /*#__PURE__*/ jsx(Toggle, {
                        checked: defaultValue === null ? null : defaultValue || false,
                        disabled: disabled,
                        offLabel: formatMessage({
                            id: 'app.components.ToggleCheckbox.off-label',
                            defaultMessage: 'False'
                        }),
                        onLabel: formatMessage({
                            id: 'app.components.ToggleCheckbox.on-label',
                            defaultMessage: 'True'
                        }),
                        onChange: (e)=>{
                            onChange({
                                target: {
                                    name,
                                    value: e.target.checked
                                }
                            });
                        }
                    });
                }
            case 'checkbox':
                {
                    return /*#__PURE__*/ jsx(Checkbox, {
                        disabled: disabled,
                        onCheckedChange: (value)=>{
                            onChange({
                                target: {
                                    name,
                                    value
                                }
                            });
                        },
                        checked: Boolean(value),
                        children: label
                    });
                }
            case 'datetime':
                {
                    const dateValue = parseDateValue(value);
                    return /*#__PURE__*/ jsx(DateTimePicker, {
                        clearLabel: formatMessage({
                            id: 'clearLabel',
                            defaultMessage: 'Clear'
                        }),
                        disabled: disabled,
                        onChange: (date)=>{
                            // check if date is not null or undefined
                            const formattedDate = date ? date.toISOString() : null;
                            onChange({
                                target: {
                                    name,
                                    value: formattedDate,
                                    type
                                }
                            });
                        },
                        onClear: ()=>onChange({
                                target: {
                                    name,
                                    value: null,
                                    type
                                }
                            }),
                        placeholder: formattedPlaceholder,
                        value: dateValue
                    });
                }
            case 'date':
                {
                    const dateValue = parseDateValue(value);
                    return /*#__PURE__*/ jsx(DatePicker, {
                        clearLabel: formatMessage({
                            id: 'clearLabel',
                            defaultMessage: 'Clear'
                        }),
                        disabled: disabled,
                        onChange: (date)=>{
                            onChange({
                                target: {
                                    name,
                                    value: date ? formatISO(date, {
                                        representation: 'date'
                                    }) : null,
                                    type
                                }
                            });
                        },
                        onClear: ()=>onChange({
                                target: {
                                    name,
                                    value: null,
                                    type
                                }
                            }),
                        placeholder: formattedPlaceholder,
                        value: dateValue
                    });
                }
            case 'number':
                {
                    return /*#__PURE__*/ jsx(NumberInput, {
                        disabled: disabled,
                        onValueChange: (value)=>{
                            onChange({
                                target: {
                                    name,
                                    value,
                                    type
                                }
                            });
                        },
                        placeholder: formattedPlaceholder,
                        step: step,
                        value: value,
                        autoFocus: autoFocus
                    });
                }
            case 'email':
                {
                    return /*#__PURE__*/ jsx(TextInput, {
                        autoComplete: autoComplete,
                        disabled: disabled,
                        onChange: (e)=>{
                            onChange({
                                target: {
                                    name,
                                    value: e.target.value,
                                    type
                                }
                            });
                        },
                        placeholder: formattedPlaceholder,
                        type: "email",
                        value: valueWithEmptyStringFallback,
                        autoFocus: autoFocus
                    });
                }
            case 'timestamp':
            case 'text':
            case 'string':
                {
                    return /*#__PURE__*/ jsx(TextInput, {
                        autoComplete: autoComplete,
                        disabled: disabled,
                        onChange: (e)=>{
                            onChange({
                                target: {
                                    name,
                                    value: e.target.value,
                                    type
                                }
                            });
                        },
                        placeholder: formattedPlaceholder,
                        type: "text",
                        value: valueWithEmptyStringFallback,
                        autoFocus: autoFocus
                    });
                }
            case 'password':
                {
                    return /*#__PURE__*/ jsx(TextInput, {
                        autoComplete: autoComplete,
                        disabled: disabled,
                        endAction: /*#__PURE__*/ jsx("button", {
                            "aria-label": formatMessage({
                                id: 'Auth.form.password.show-password',
                                defaultMessage: 'Show password'
                            }),
                            onClick: ()=>{
                                setShowPassword((prev)=>!prev);
                            },
                            style: {
                                border: 'none',
                                padding: 0,
                                background: 'transparent'
                            },
                            type: "button",
                            children: showPassword ? /*#__PURE__*/ jsx(Eye, {
                                fill: "neutral500"
                            }) : /*#__PURE__*/ jsx(EyeStriked, {
                                fill: "neutral500"
                            })
                        }),
                        onChange: (e)=>{
                            onChange({
                                target: {
                                    name,
                                    value: e.target.value,
                                    type
                                }
                            });
                        },
                        placeholder: formattedPlaceholder,
                        type: showPassword ? 'text' : 'password',
                        value: valueWithEmptyStringFallback
                    });
                }
            case 'select':
                {
                    return /*#__PURE__*/ jsx(SingleSelect, {
                        disabled: disabled,
                        onChange: (value)=>{
                            onChange({
                                target: {
                                    name,
                                    value,
                                    type: 'select'
                                }
                            });
                        },
                        placeholder: formattedPlaceholder,
                        value: value,
                        children: options.map(({ metadatas: { intlLabel, disabled, hidden }, key, value })=>{
                            return /*#__PURE__*/ jsx(SingleSelectOption, {
                                value: value,
                                disabled: disabled,
                                hidden: hidden,
                                children: formatMessage(intlLabel)
                            }, key);
                        })
                    });
                }
            case 'textarea':
                {
                    return /*#__PURE__*/ jsx(Textarea, {
                        disabled: disabled,
                        onChange: (event)=>onChange({
                                target: {
                                    name,
                                    value: event.target.value,
                                    type
                                }
                            }),
                        placeholder: formattedPlaceholder,
                        value: valueWithEmptyStringFallback
                    });
                }
            case 'time':
                {
                    const formattedValue = handleTimeChange({
                        value,
                        onChange,
                        name,
                        type
                    });
                    return /*#__PURE__*/ jsx(TimePicker, {
                        clearLabel: formatMessage({
                            id: 'clearLabel',
                            defaultMessage: 'Clear'
                        }),
                        disabled: disabled,
                        onChange: (time)=>handleTimeChangeEvent(onChange, name, type, time),
                        onClear: ()=>handleTimeChangeEvent(onChange, name, type, undefined),
                        value: formattedValue
                    });
                }
            default:
                {
                    /**
         * If there's no component for the given type, we return a disabled text input
         * showing a "Not supported" title to illustrate the issue.
         */ return /*#__PURE__*/ jsx(TextInput, {
                        disabled: true,
                        placeholder: "Not supported",
                        type: "text",
                        value: ""
                    });
                }
        }
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: errorMessage,
        name: name,
        hint: hint,
        required: required,
        children: [
            type !== 'checkbox' ? /*#__PURE__*/ jsx(Field.Label, {
                action: labelAction,
                children: label
            }) : null,
            getComponent(),
            /*#__PURE__*/ jsx(Field.Error, {}),
            /*#__PURE__*/ jsx(Field.Hint, {})
        ]
    });
};
/**
 * @description
 * A hook for generating the hint for a field
 */ const useFieldHint = ({ description, fieldSchema, type })=>{
    const { formatMessage } = useIntl();
    const buildDescription = ()=>description?.id ? formatMessage({
            id: description.id,
            defaultMessage: description.defaultMessage
        }, {
            ...description.values
        }) : '';
    const buildHint = ()=>{
        const { maximum, minimum } = getMinMax(fieldSchema);
        const units = getFieldUnits({
            type,
            minimum,
            maximum
        });
        const minIsNumber = typeof minimum === 'number';
        const maxIsNumber = typeof maximum === 'number';
        const hasMinAndMax = maxIsNumber && minIsNumber;
        const hasMinOrMax = maxIsNumber || minIsNumber;
        if (!description?.id && !hasMinOrMax) {
            return '';
        }
        return formatMessage({
            id: 'content-manager.form.Input.hint.text',
            defaultMessage: '{min, select, undefined {} other {min. {min}}}{divider}{max, select, undefined {} other {max. {max}}}{unit}{br}{description}'
        }, {
            min: minimum,
            max: maximum,
            description: buildDescription(),
            unit: units?.message && hasMinOrMax ? formatMessage(units.message, units.values) : null,
            divider: hasMinAndMax ? formatMessage({
                id: 'content-manager.form.Input.hint.minMaxDivider',
                defaultMessage: ' / '
            }) : null,
            br: hasMinOrMax ? /*#__PURE__*/ jsx("br", {}) : null
        });
    };
    return {
        hint: buildHint()
    };
};
const getFieldUnits = ({ type, minimum, maximum })=>{
    if (type && [
        'biginteger',
        'integer',
        'number'
    ].includes(type)) {
        return {};
    }
    const maxValue = Math.max(minimum || 0, maximum || 0);
    return {
        message: {
            id: 'content-manager.form.Input.hint.character.unit',
            defaultMessage: '{maxValue, plural, one { character} other { characters}}'
        },
        values: {
            maxValue
        }
    };
};
const getMinMax = (fieldSchema)=>{
    if (!fieldSchema) {
        return {
            maximum: undefined,
            minimum: undefined
        };
    }
    const { minLength, maxLength, max, min } = fieldSchema;
    let minimum;
    let maximum;
    const parsedMin = Number(min);
    const parsedMinLength = Number(minLength);
    if (!Number.isNaN(parsedMin)) {
        minimum = parsedMin;
    } else if (!Number.isNaN(parsedMinLength)) {
        minimum = parsedMinLength;
    }
    const parsedMax = Number(max);
    const parsedMaxLength = Number(maxLength);
    if (!Number.isNaN(parsedMax)) {
        maximum = parsedMax;
    } else if (!Number.isNaN(parsedMaxLength)) {
        maximum = parsedMaxLength;
    }
    return {
        maximum,
        minimum
    };
};
/**
 * we've memoized this component because we use a context to store all the data in our form in the content-manager.
 * This then causes _every_ component to re-render because there are no selects incurring performance issues
 * in content-types as the content-type gets more complicated.
 */ const MemoizedGenericInput = /*#__PURE__*/ React.memo(GenericInput, isEqual);

export { MemoizedGenericInput as GenericInput };
//# sourceMappingURL=GenericInputs.mjs.map
