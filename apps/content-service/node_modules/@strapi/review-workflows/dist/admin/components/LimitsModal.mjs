import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Modal, Typography, Flex, Box, IconButton, LinkButton } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import img from '../assets/balloon.png.mjs';

const CTA_LEARN_MORE_HREF = 'https://strapi.io/pricing-cloud';
const CTA_SALES_HREF = 'https://strapi.io/contact-sales';
const Title = ({ children })=>{
    return /*#__PURE__*/ jsx(Modal.Title, {
        variant: "alpha",
        children: children
    });
};
const Body = ({ children })=>{
    return /*#__PURE__*/ jsx(Typography, {
        variant: "omega",
        children: children
    });
};
const CallToActions = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        gap: 2,
        paddingTop: 4,
        children: [
            /*#__PURE__*/ jsx(LinkButton, {
                variant: "default",
                isExternal: true,
                href: CTA_LEARN_MORE_HREF,
                children: formatMessage({
                    id: 'Settings.review-workflows.limit.cta.learn',
                    defaultMessage: 'Learn more'
                })
            }),
            /*#__PURE__*/ jsx(LinkButton, {
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
const BalloonImage = styled.img`
  // Margin top|right reverse the padding of ModalBody
  margin-right: ${({ theme })=>`-${theme.spaces[7]}`};
  margin-top: ${({ theme })=>`-${theme.spaces[7]}`};
  width: 360px;
`;
const Root = ({ children, open = false, onOpenChange })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Modal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: /*#__PURE__*/ jsx(Modal.Content, {
            children: /*#__PURE__*/ jsx(Modal.Body, {
                children: /*#__PURE__*/ jsxs(Flex, {
                    gap: 2,
                    paddingLeft: 7,
                    position: "relative",
                    children: [
                        /*#__PURE__*/ jsxs(Flex, {
                            alignItems: "start",
                            direction: "column",
                            gap: 2,
                            width: "60%",
                            children: [
                                children,
                                /*#__PURE__*/ jsx(CallToActions, {})
                            ]
                        }),
                        /*#__PURE__*/ jsxs(Flex, {
                            justifyContent: "end",
                            height: "100%",
                            width: "40%",
                            children: [
                                /*#__PURE__*/ jsx(BalloonImage, {
                                    src: img,
                                    "aria-hidden": true,
                                    alt: "",
                                    loading: "lazy"
                                }),
                                /*#__PURE__*/ jsx(Box, {
                                    display: "flex",
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    children: /*#__PURE__*/ jsx(Modal.Close, {
                                        children: /*#__PURE__*/ jsx(IconButton, {
                                            withTooltip: false,
                                            label: formatMessage({
                                                id: 'global.close',
                                                defaultMessage: 'Close'
                                            }),
                                            children: /*#__PURE__*/ jsx(Cross, {})
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

export { LimitsModal };
//# sourceMappingURL=LimitsModal.mjs.map
