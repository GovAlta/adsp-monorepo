'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styled = require('styled-components');

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

const ConditionsButtonImpl = /*#__PURE__*/ React__namespace.forwardRef(({ onClick, className, hasConditions = false, variant = 'tertiary' }, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(ButtonContainer, {
        $hasConditions: hasConditions,
        className: className,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
            variant: variant,
            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Cog, {}),
            onClick: onClick,
            ref: ref,
            type: "button",
            children: formatMessage({
                id: 'global.settings',
                defaultMessage: 'Settings'
            })
        })
    });
});
const ButtonContainer = styled.styled(designSystem.Box)`
  ${({ $hasConditions, theme })=>$hasConditions && `
    &:before {
      content: '';
      position: absolute;
      top: -3px;
      left: -10px;
      width: 6px;
      height: 6px;
      border-radius: 2rem;
      background: ${theme.colors.primary600};
    }
  `}
`;
/**
 * We reference the component directly in other styled-components
 * and as such we need it to have a className already assigned.
 * Therefore we wrapped the implementation in a styled function.
 */ const ConditionsButton = styled.styled(ConditionsButtonImpl)``;

exports.ConditionsButton = ConditionsButton;
//# sourceMappingURL=ConditionsButton.js.map
