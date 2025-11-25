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

const mutateEditViewHook = ({ layout })=>{
    // If i18n isn't explicitly enabled on the content type, then no field can be localized
    if (!('i18n' in layout.options) || typeof layout.options.i18n === 'object' && layout.options.i18n !== null && 'localized' in layout.options.i18n && !layout.options.i18n.localized) {
        return {
            layout
        };
    }
    const components = Object.entries(layout.components).reduce((acc, [key, componentLayout])=>{
        return {
            ...acc,
            [key]: {
                ...componentLayout,
                layout: componentLayout.layout.map((row)=>row.map(addLabelActionToField))
            }
        };
    }, {});
    return {
        layout: {
            ...layout,
            components,
            layout: layout.layout.map((panel)=>panel.map((row)=>row.map(addLabelActionToField)))
        }
    };
};
const addLabelActionToField = (field)=>{
    const isFieldLocalized = doesFieldHaveI18nPluginOpt(field.attribute.pluginOptions) ? field.attribute.pluginOptions.i18n.localized : true;
    const labelActionProps = {
        title: {
            id: isFieldLocalized ? getTranslation.getTranslation('Field.localized') : getTranslation.getTranslation('Field.not-localized'),
            defaultMessage: isFieldLocalized ? 'This value is unique for the selected locale' : 'This value is the same across all locales'
        },
        icon: isFieldLocalized ? /*#__PURE__*/ jsxRuntime.jsx(icons.Earth, {}) : null
    };
    return {
        ...field,
        labelAction: isFieldLocalized ? /*#__PURE__*/ jsxRuntime.jsx(LabelAction, {
            ...labelActionProps
        }) : null
    };
};
const doesFieldHaveI18nPluginOpt = (pluginOpts)=>{
    if (!pluginOpts) {
        return false;
    }
    return 'i18n' in pluginOpts && typeof pluginOpts.i18n === 'object' && pluginOpts.i18n !== null && 'localized' in pluginOpts.i18n;
};
const LabelAction = ({ title, icon })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(Span, {
        tag: "span",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                tag: "span",
                children: formatMessage(title)
            }),
            /*#__PURE__*/ React__namespace.cloneElement(icon, {
                'aria-hidden': true,
                focusable: false
            })
        ]
    });
};
const Span = styledComponents.styled(designSystem.Flex)`
  svg {
    width: 12px;
    height: 12px;

    fill: ${({ theme })=>theme.colors.neutral500};

    path {
      fill: ${({ theme })=>theme.colors.neutral500};
    }
  }
`;

exports.mutateEditViewHook = mutateEditViewHook;
//# sourceMappingURL=editView.js.map
