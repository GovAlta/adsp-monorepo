'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var getTranslation = require('../utils/getTranslation.js');

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

const TextAlignTypography = styledComponents.styled(designSystem.Typography)`
  text-align: center;
`;
const CheckboxConfirmation = ({ description, isCreating = false, intlLabel, name, onChange, value })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [isOpen, setIsOpen] = React__namespace.useState(false);
    const handleChange = (value)=>{
        if (isCreating || value) {
            return onChange({
                target: {
                    name,
                    value,
                    type: 'checkbox'
                }
            });
        }
        if (!value) {
            return setIsOpen(true);
        }
        return null;
    };
    const handleConfirm = ()=>{
        onChange({
            target: {
                name,
                value: false,
                type: 'checkbox'
            }
        });
    };
    const label = intlLabel.id ? formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage
    }, {
        ...intlLabel.values
    }) : name;
    const hint = description ? formatMessage({
        id: description.id,
        defaultMessage: description.defaultMessage
    }, {
        ...description.values
    }) : '';
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Root, {
        open: isOpen,
        onOpenChange: setIsOpen,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                hint: hint,
                name: name,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                        onCheckedChange: handleChange,
                        checked: value,
                        children: label
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Content, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Header, {
                        children: formatMessage({
                            id: getTranslation.getTranslation('CheckboxConfirmation.Modal.title'),
                            defaultMessage: 'Disable localization'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Body, {
                        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {}),
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(TextAlignTypography, {
                                        children: formatMessage({
                                            id: getTranslation.getTranslation('CheckboxConfirmation.Modal.content'),
                                            defaultMessage: 'Disabling localization will engender the deletion of all your content but the one associated to your default locale (if existing).'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        fontWeight: "semiBold",
                                        children: formatMessage({
                                            id: getTranslation.getTranslation('CheckboxConfirmation.Modal.body'),
                                            defaultMessage: 'Do you want to disable it?'
                                        })
                                    })
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Footer, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Cancel, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    variant: "tertiary",
                                    children: formatMessage({
                                        id: 'components.popUpWarning.button.cancel',
                                        defaultMessage: 'No, cancel'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Action, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    variant: "danger-light",
                                    onClick: handleConfirm,
                                    children: formatMessage({
                                        id: getTranslation.getTranslation('CheckboxConfirmation.Modal.button-confirm'),
                                        defaultMessage: 'Yes, disable'
                                    })
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

exports.CheckboxConfirmation = CheckboxConfirmation;
//# sourceMappingURL=CheckboxConfirmation.js.map
