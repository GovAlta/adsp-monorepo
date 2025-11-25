'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var Collapsible = require('../Collapsible.js');

const rotate = styledComponents.keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
const SpinningLoader = styledComponents.styled(Icons.Loader)`
  animation: ${rotate} 1s linear infinite;
`;
const RotatingIcon = styledComponents.styled(designSystem.Box)`
  transform: rotate(${({ $open })=>$open ? '180deg' : '0deg'});
  transition: transform ${({ theme })=>theme.motion.timings['200']}
    ${({ theme })=>theme.motion.easings.easeOutQuad};
`;
const Status = ({ status })=>{
    switch(status){
        case 'update':
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                fontWeight: "semiBold",
                textColor: "warning500",
                children: "M"
            });
        case 'remove':
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                fontWeight: "semiBold",
                textColor: "danger500",
                children: "D"
            });
        case 'create':
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                fontWeight: "semiBold",
                textColor: "success500",
                children: "N"
            });
        default:
            return null;
    }
};
const Marker = ({ title, steps, state })=>{
    const getStateIcon = ()=>{
        switch(state){
            case 'success':
                return /*#__PURE__*/ jsxRuntime.jsx(Icons.Check, {
                    fill: "success500"
                });
            case 'loading':
                return /*#__PURE__*/ jsxRuntime.jsx(SpinningLoader, {});
            case 'error':
                return /*#__PURE__*/ jsxRuntime.jsx(Icons.Cross, {
                    fill: "danger500"
                });
            default:
                return null;
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        borderWidth: "1px",
        borderColor: "neutral200",
        borderStyle: "solid",
        hasRadius: true,
        marginBottom: 3,
        width: '336px',
        children: /*#__PURE__*/ jsxRuntime.jsxs(Collapsible.Collapsible, {
            defaultOpen: false,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(Collapsible.CollapsibleTrigger, {
                    children: ({ open })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            padding: 3,
                            borderColor: "neutral200",
                            borderWidth: open ? '0 0 1px 0' : '0',
                            borderStyle: "solid",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                gap: 2,
                                alignItems: "center",
                                children: [
                                    getStateIcon(),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        children: title
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                        marginLeft: "auto",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(RotatingIcon, {
                                            as: Icons.ChevronDown,
                                            $open: open
                                        })
                                    })
                                ]
                            })
                        })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Collapsible.CollapsibleContent, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        gap: 3,
                        padding: 3,
                        direction: "column",
                        children: steps.map((step)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                gap: 2,
                                justifyContent: "space-between",
                                width: "100%",
                                padding: [
                                    0,
                                    1
                                ],
                                children: [
                                    step.link ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                                        tag: reactRouterDom.Link,
                                        to: step.link,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            children: step.description
                                        })
                                    }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        children: step.description
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(Status, {
                                        status: step.status
                                    })
                                ]
                            }, step.id))
                    })
                })
            ]
        })
    });
};

exports.Marker = Marker;
//# sourceMappingURL=Marker.js.map
