'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var ReactSelect = require('react-select');
var styledComponents = require('styled-components');

const ToggleButton = styledComponents.styled(designSystem.Flex)`
  align-self: flex-end;
  height: 2.2rem;
  width: 2.8rem;

  &:hover,
  &:focus {
    background-color: ${({ theme })=>theme.colors.primary200};
  }
`;
const Option = ({ children, data, selectProps, ...props })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { depth, value, children: options } = data;
    const { maxDisplayDepth, openValues, onOptionToggle } = selectProps;
    const isOpen = openValues.includes(value);
    const Icon = isOpen ? icons.ChevronUp : icons.ChevronDown;
    return /*#__PURE__*/ jsxRuntime.jsx(ReactSelect.components.Option, {
        data: data,
        selectProps: selectProps,
        ...props,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            alignItems: "start",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    textColor: "neutral800",
                    ellipsis: true,
                    children: /*#__PURE__*/ jsxRuntime.jsx("span", {
                        style: {
                            paddingLeft: `${Math.min(depth, maxDisplayDepth) * 14}px`
                        },
                        children: children
                    })
                }),
                options && options?.length > 0 && /*#__PURE__*/ jsxRuntime.jsx(ToggleButton, {
                    "aria-label": formatMessage({
                        id: 'app.utils.toggle',
                        defaultMessage: 'Toggle'
                    }),
                    tag: "button",
                    alignItems: "center",
                    hasRadius: true,
                    justifyContent: "center",
                    marginLeft: "auto",
                    onClick: (event)=>{
                        event.preventDefault();
                        event.stopPropagation();
                        onOptionToggle(value);
                    },
                    children: /*#__PURE__*/ jsxRuntime.jsx(Icon, {
                        width: "1.4rem",
                        fill: "neutral500"
                    })
                })
            ]
        })
    });
};

exports.Option = Option;
//# sourceMappingURL=Option.js.map
