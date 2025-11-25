'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');
var Boolean = require('./Boolean.js');
var Checkbox = require('./Checkbox.js');
var Date = require('./Date.js');
var DateTime = require('./DateTime.js');
var Email = require('./Email.js');
var Enumeration = require('./Enumeration.js');
var Json = require('./Json.js');
var Number = require('./Number.js');
var Password = require('./Password.js');
var String = require('./String.js');
var Textarea = require('./Textarea.js');
var Time = require('./Time.js');

/* -------------------------------------------------------------------------------------------------
 * InputRenderer
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal This needs to be tested before being exposed as a public API.
 * @experimental
 * @description A generic form renderer for Strapi forms. Similar to GenericInputs but with a different API.
 * The entire component is memoized to avoid re-renders in large forms.
 */ const InputRenderer = /*#__PURE__*/ React.memo(/*#__PURE__*/ React.forwardRef((props, forwardRef)=>{
    switch(props.type){
        case 'biginteger':
        case 'timestamp':
        case 'string':
        case 'uid':
            return /*#__PURE__*/ jsxRuntime.jsx(String.StringInput, {
                ref: forwardRef,
                ...props
            });
        case 'boolean':
            return /*#__PURE__*/ jsxRuntime.jsx(Boolean.BooleanInput, {
                ref: forwardRef,
                ...props
            });
        case 'checkbox':
            return /*#__PURE__*/ jsxRuntime.jsx(Checkbox.CheckboxInput, {
                ref: forwardRef,
                ...props
            });
        case 'datetime':
            return /*#__PURE__*/ jsxRuntime.jsx(DateTime.DateTimeInput, {
                ref: forwardRef,
                ...props
            });
        case 'date':
            return /*#__PURE__*/ jsxRuntime.jsx(Date.DateInput, {
                ref: forwardRef,
                ...props
            });
        case 'decimal':
        case 'float':
        case 'integer':
            return /*#__PURE__*/ jsxRuntime.jsx(Number.NumberInput, {
                ref: forwardRef,
                ...props
            });
        case 'json':
            return /*#__PURE__*/ jsxRuntime.jsx(Json.JsonInput, {
                ref: forwardRef,
                ...props
            });
        case 'email':
            return /*#__PURE__*/ jsxRuntime.jsx(Email.EmailInput, {
                ref: forwardRef,
                ...props
            });
        case 'enumeration':
            return /*#__PURE__*/ jsxRuntime.jsx(Enumeration.EnumerationInput, {
                ref: forwardRef,
                ...props
            });
        case 'password':
            return /*#__PURE__*/ jsxRuntime.jsx(Password.PasswordInput, {
                ref: forwardRef,
                ...props
            });
        case 'text':
            return /*#__PURE__*/ jsxRuntime.jsx(Textarea.TextareaInput, {
                ref: forwardRef,
                ...props
            });
        case 'time':
            return /*#__PURE__*/ jsxRuntime.jsx(Time.TimeInput, {
                ref: forwardRef,
                ...props
            });
        default:
            // This is cast because this renderer tackles all the possibilities of the InputProps, but this is for runtime catches.
            return /*#__PURE__*/ jsxRuntime.jsx(NotSupportedField, {
                ref: forwardRef,
                ...props
            });
    }
}));
const NotSupportedField = /*#__PURE__*/ React.forwardRef(({ label, hint, name, required, type, labelAction }, ref)=>{
    const { error } = Form.useField(name);
    const fieldRef = useFocusInputField.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: error,
        name: name,
        hint: hint,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                ref: composedRefs,
                disabled: true,
                placeholder: `Unsupported field type: ${type}`,
                required: required,
                type: "text",
                value: ""
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedInputRenderer = /*#__PURE__*/ React.memo(InputRenderer);

exports.InputRenderer = MemoizedInputRenderer;
//# sourceMappingURL=Renderer.js.map
