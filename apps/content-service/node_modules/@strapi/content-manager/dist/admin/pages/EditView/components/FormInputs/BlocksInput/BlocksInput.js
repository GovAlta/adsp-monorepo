'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var BlocksEditor = require('./BlocksEditor.js');

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

const BlocksInput = /*#__PURE__*/ React__namespace.forwardRef(({ label, name, required = false, hint, labelAction, ...editorProps }, forwardedRef)=>{
    const id = React__namespace.useId();
    const field = strapiAdmin.useField(name);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
        id: id,
        name: name,
        hint: hint,
        error: field.error,
        required: required,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 1,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                    action: labelAction,
                    children: label
                }),
                /*#__PURE__*/ jsxRuntime.jsx(BlocksEditor.BlocksEditor, {
                    name: name,
                    error: field.error,
                    ref: forwardedRef,
                    value: field.value,
                    onChange: field.onChange,
                    ariaLabelId: id,
                    ...editorProps
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
            ]
        })
    });
});
const MemoizedBlocksInput = /*#__PURE__*/ React__namespace.memo(BlocksInput);

exports.BlocksInput = MemoizedBlocksInput;
//# sourceMappingURL=BlocksInput.js.map
