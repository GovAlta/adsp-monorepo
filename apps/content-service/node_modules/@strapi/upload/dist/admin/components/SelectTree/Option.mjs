import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Flex, Typography } from '@strapi/design-system';
import { ChevronUp, ChevronDown } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { components } from 'react-select';
import { styled } from 'styled-components';

const ToggleButton = styled(Flex)`
  align-self: flex-end;
  height: 2.2rem;
  width: 2.8rem;

  &:hover,
  &:focus {
    background-color: ${({ theme })=>theme.colors.primary200};
  }
`;
const Option = ({ children, data, selectProps, ...props })=>{
    const { formatMessage } = useIntl();
    const { depth, value, children: options } = data;
    const { maxDisplayDepth, openValues, onOptionToggle } = selectProps;
    const isOpen = openValues.includes(value);
    const Icon = isOpen ? ChevronUp : ChevronDown;
    return /*#__PURE__*/ jsx(components.Option, {
        data: data,
        selectProps: selectProps,
        ...props,
        children: /*#__PURE__*/ jsxs(Flex, {
            alignItems: "start",
            children: [
                /*#__PURE__*/ jsx(Typography, {
                    textColor: "neutral800",
                    ellipsis: true,
                    children: /*#__PURE__*/ jsx("span", {
                        style: {
                            paddingLeft: `${Math.min(depth, maxDisplayDepth) * 14}px`
                        },
                        children: children
                    })
                }),
                options && options?.length > 0 && /*#__PURE__*/ jsx(ToggleButton, {
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
                    children: /*#__PURE__*/ jsx(Icon, {
                        width: "1.4rem",
                        fill: "neutral500"
                    })
                })
            ]
        })
    });
};

export { Option };
//# sourceMappingURL=Option.mjs.map
