import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Flex, Typography, Link } from '@strapi/design-system';
import { Loader, ChevronDown, Cross, Check } from '@strapi/icons';
import { Link as Link$1 } from 'react-router-dom';
import { keyframes, styled } from 'styled-components';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../Collapsible.mjs';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
const SpinningLoader = styled(Loader)`
  animation: ${rotate} 1s linear infinite;
`;
const RotatingIcon = styled(Box)`
  transform: rotate(${({ $open })=>$open ? '180deg' : '0deg'});
  transition: transform ${({ theme })=>theme.motion.timings['200']}
    ${({ theme })=>theme.motion.easings.easeOutQuad};
`;
const Status = ({ status })=>{
    switch(status){
        case 'update':
            return /*#__PURE__*/ jsx(Typography, {
                fontWeight: "semiBold",
                textColor: "warning500",
                children: "M"
            });
        case 'remove':
            return /*#__PURE__*/ jsx(Typography, {
                fontWeight: "semiBold",
                textColor: "danger500",
                children: "D"
            });
        case 'create':
            return /*#__PURE__*/ jsx(Typography, {
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
                return /*#__PURE__*/ jsx(Check, {
                    fill: "success500"
                });
            case 'loading':
                return /*#__PURE__*/ jsx(SpinningLoader, {});
            case 'error':
                return /*#__PURE__*/ jsx(Cross, {
                    fill: "danger500"
                });
            default:
                return null;
        }
    };
    return /*#__PURE__*/ jsx(Box, {
        borderWidth: "1px",
        borderColor: "neutral200",
        borderStyle: "solid",
        hasRadius: true,
        marginBottom: 3,
        width: '336px',
        children: /*#__PURE__*/ jsxs(Collapsible, {
            defaultOpen: false,
            children: [
                /*#__PURE__*/ jsx(CollapsibleTrigger, {
                    children: ({ open })=>/*#__PURE__*/ jsx(Box, {
                            padding: 3,
                            borderColor: "neutral200",
                            borderWidth: open ? '0 0 1px 0' : '0',
                            borderStyle: "solid",
                            children: /*#__PURE__*/ jsxs(Flex, {
                                gap: 2,
                                alignItems: "center",
                                children: [
                                    getStateIcon(),
                                    /*#__PURE__*/ jsx(Typography, {
                                        children: title
                                    }),
                                    /*#__PURE__*/ jsx(Flex, {
                                        marginLeft: "auto",
                                        children: /*#__PURE__*/ jsx(RotatingIcon, {
                                            as: ChevronDown,
                                            $open: open
                                        })
                                    })
                                ]
                            })
                        })
                }),
                /*#__PURE__*/ jsx(CollapsibleContent, {
                    children: /*#__PURE__*/ jsx(Flex, {
                        gap: 3,
                        padding: 3,
                        direction: "column",
                        children: steps.map((step)=>/*#__PURE__*/ jsxs(Flex, {
                                gap: 2,
                                justifyContent: "space-between",
                                width: "100%",
                                padding: [
                                    0,
                                    1
                                ],
                                children: [
                                    step.link ? /*#__PURE__*/ jsx(Link, {
                                        tag: Link$1,
                                        to: step.link,
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            children: step.description
                                        })
                                    }) : /*#__PURE__*/ jsx(Typography, {
                                        children: step.description
                                    }),
                                    /*#__PURE__*/ jsx(Status, {
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

export { Marker };
//# sourceMappingURL=Marker.mjs.map
