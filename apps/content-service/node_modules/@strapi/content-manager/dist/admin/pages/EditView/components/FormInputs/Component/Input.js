'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var useDocumentContext = require('../../../../../hooks/useDocumentContext.js');
var translations = require('../../../../../utils/translations.js');
var data = require('../../../utils/data.js');
var forms = require('../../../utils/forms.js');
var Initializer = require('./Initializer.js');
var NonRepeatable = require('./NonRepeatable.js');
var Repeatable = require('./Repeatable.js');

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

const ComponentInput = ({ label, required, name, attribute, disabled, labelAction, ...props })=>{
    const { formatMessage } = reactIntl.useIntl();
    const field = strapiAdmin.useField(name);
    const showResetComponent = !attribute.repeatable && field.value && !disabled;
    const { currentDocument: { components } } = useDocumentContext.useDocumentContext('ComponentInput');
    const handleInitialisationClick = ()=>{
        const schema = components[attribute.component];
        const form = forms.createDefaultForm(schema, components);
        const data$1 = data.transformDocument(schema, components)(form);
        field.onChange(name, data$1);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: field.error,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                justifyContent: "space-between",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Label, {
                        action: labelAction,
                        children: [
                            label,
                            attribute.repeatable && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                children: [
                                    " (",
                                    Array.isArray(field.value) ? field.value.length : 0,
                                    ")"
                                ]
                            })
                        ]
                    }),
                    showResetComponent && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                        label: formatMessage({
                            id: translations.getTranslation('components.reset-entry'),
                            defaultMessage: 'Reset Entry'
                        }),
                        variant: "ghost",
                        onClick: ()=>{
                            field.onChange(name, null);
                        },
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Trash, {})
                    })
                ]
            }),
            !attribute.repeatable && !field.value && /*#__PURE__*/ jsxRuntime.jsx(Initializer.Initializer, {
                disabled: disabled,
                name: name,
                onClick: handleInitialisationClick
            }),
            !attribute.repeatable && field.value ? /*#__PURE__*/ jsxRuntime.jsx(NonRepeatable.NonRepeatableComponent, {
                attribute: attribute,
                name: name,
                disabled: disabled,
                ...props,
                children: props.children
            }) : null,
            attribute.repeatable && /*#__PURE__*/ jsxRuntime.jsx(Repeatable.RepeatableComponent, {
                attribute: attribute,
                name: name,
                disabled: disabled,
                ...props,
                children: props.children
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};
const MemoizedComponentInput = /*#__PURE__*/ React__namespace.memo(ComponentInput);

exports.ComponentInput = MemoizedComponentInput;
//# sourceMappingURL=Input.js.map
