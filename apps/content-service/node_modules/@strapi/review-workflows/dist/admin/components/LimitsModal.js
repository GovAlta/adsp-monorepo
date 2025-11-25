'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var balloon = require('../assets/balloon.png.js');

const CTA_LEARN_MORE_HREF = 'https://strapi.io/pricing-cloud';
const CTA_SALES_HREF = 'https://strapi.io/contact-sales';
const Title = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
        variant: "alpha",
        children: children
    });
};
const Body = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        variant: "omega",
        children: children
    });
};
const CallToActions = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        gap: 2,
        paddingTop: 4,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                variant: "default",
                isExternal: true,
                href: CTA_LEARN_MORE_HREF,
                children: formatMessage({
                    id: 'Settings.review-workflows.limit.cta.learn',
                    defaultMessage: 'Learn more'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                variant: "tertiary",
                isExternal: true,
                href: CTA_SALES_HREF,
                children: formatMessage({
                    id: 'Settings.review-workflows.limit.cta.sales',
                    defaultMessage: 'Contact Sales'
                })
            })
        ]
    });
};
const BalloonImage = styledComponents.styled.img`
  // Margin top|right reverse the padding of ModalBody
  margin-right: ${({ theme })=>`-${theme.spaces[7]}`};
  margin-top: ${({ theme })=>`-${theme.spaces[7]}`};
  width: 360px;
`;
const Root = ({ children, open = false, onOpenChange })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    gap: 2,
                    paddingLeft: 7,
                    position: "relative",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            alignItems: "start",
                            direction: "column",
                            gap: 2,
                            width: "60%",
                            children: [
                                children,
                                /*#__PURE__*/ jsxRuntime.jsx(CallToActions, {})
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            justifyContent: "end",
                            height: "100%",
                            width: "40%",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(BalloonImage, {
                                    src: balloon,
                                    "aria-hidden": true,
                                    alt: "",
                                    loading: "lazy"
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    display: "flex",
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Close, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                            withTooltip: false,
                                            label: formatMessage({
                                                id: 'global.close',
                                                defaultMessage: 'Close'
                                            }),
                                            children: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {})
                                        })
                                    })
                                })
                            ]
                        })
                    ]
                })
            })
        })
    });
};
const LimitsModal = {
    Title,
    Body,
    Root
};

exports.LimitsModal = LimitsModal;
//# sourceMappingURL=LimitsModal.js.map
