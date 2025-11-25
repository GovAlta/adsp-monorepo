'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

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

const JsonInput = /*#__PURE__*/ React__namespace.forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const field = Form.useField(name);
    const fieldRef = useFocusInputField.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.JSONInput, {
                ref: composedRefs,
                value: typeof field.value == 'object' ? JSON.stringify(field.value, null, 2) : field.value,
                onChange: (json)=>{
                    // Default to null when the field is not required and there is no input value
                    const value = required && !json.length ? null : json;
                    field.onChange(name, value);
                },
                minHeight: `25.2rem`,
                maxHeight: `50.4rem`,
                ...props
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedJsonInput = /*#__PURE__*/ React__namespace.memo(JsonInput);

exports.JsonInput = MemoizedJsonInput;
//# sourceMappingURL=Json.js.map
