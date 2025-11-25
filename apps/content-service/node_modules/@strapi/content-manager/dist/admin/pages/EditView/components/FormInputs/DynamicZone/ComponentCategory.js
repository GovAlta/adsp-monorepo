'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var ComponentIcon = require('../../../../../components/ComponentIcon.js');

const ComponentCategory = ({ category, components = [], variant = 'primary', onAddComponent })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Accordion.Item, {
        value: category,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Header, {
                variant: variant,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Trigger, {
                    children: formatMessage({
                        id: category,
                        defaultMessage: category
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(ResponsiveAccordionContent, {
                children: /*#__PURE__*/ jsxRuntime.jsx(Grid, {
                    paddingTop: 4,
                    paddingBottom: 4,
                    paddingLeft: 3,
                    paddingRight: 3,
                    children: components.map(({ uid, displayName, icon })=>/*#__PURE__*/ jsxRuntime.jsx(ComponentBox, {
                            tag: "button",
                            type: "button",
                            background: "neutral100",
                            justifyContent: "center",
                            onClick: onAddComponent(uid),
                            hasRadius: true,
                            height: "8.4rem",
                            shrink: 0,
                            borderColor: "neutral200",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                gap: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(ComponentIcon.ComponentIcon, {
                                        color: "currentColor",
                                        background: "primary200",
                                        icon: icon
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        variant: "pi",
                                        fontWeight: "bold",
                                        children: displayName
                                    })
                                ]
                            })
                        }, uid))
                })
            })
        ]
    });
};
const ResponsiveAccordionContent = styledComponents.styled(designSystem.Accordion.Content)`
  container-type: inline-size;
`;
/**
 * TODO:
 * JSDOM cannot handle container queries.
 * This is a temporary workaround so that tests do not fail in the CI when jestdom throws an error
 * for failing to parse the stylesheet.
 */ const Grid = process.env.NODE_ENV !== 'test' ? styledComponents.styled(designSystem.Box)`
        display: grid;
        grid-template-columns: repeat(auto-fill, 100%);
        grid-gap: 4px;

        ${({ theme })=>theme.breakpoints.medium} {
          grid-template-columns: repeat(auto-fill, 14rem);
        }
      ` : styledComponents.styled(designSystem.Box)`
        display: grid;
        grid-template-columns: repeat(auto-fill, 100%);
        grid-gap: 4px;
      `;
const ComponentBox = styledComponents.styled(designSystem.Flex)`
  color: ${({ theme })=>theme.colors.neutral600};
  cursor: pointer;

  @media (prefers-reduced-motion: no-preference) {
    transition: color 120ms ${(props)=>props.theme.motion.easings.easeOutQuad};
  }

  &:focus,
  &:hover {
    border: 1px solid ${({ theme })=>theme.colors.primary200};
    background: ${({ theme })=>theme.colors.primary100};
    color: ${({ theme })=>theme.colors.primary600};
  }
`;

exports.ComponentCategory = ComponentCategory;
//# sourceMappingURL=ComponentCategory.js.map
