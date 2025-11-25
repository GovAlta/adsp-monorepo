import { jsxs, jsx } from 'react/jsx-runtime';
import { Box, Flex, Typography, LinkButton } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import * as qs from 'qs';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';
import { getTrad } from '../../utils/getTrad.mjs';

const EmptyCard = styled(Box)`
  background: ${({ theme })=>`linear-gradient(180deg, rgba(234, 234, 239, 0) 0%, ${theme.colors.neutral150} 100%)`};
  opacity: 0.33;
`;
const EmptyCardGrid = ()=>{
    return /*#__PURE__*/ jsx(Flex, {
        wrap: "wrap",
        gap: 4,
        children: [
            ...Array(4)
        ].map((_, idx)=>{
            return /*#__PURE__*/ jsx(EmptyCard, {
                height: "138px",
                width: "375px",
                hasRadius: true
            }, `empty-card-${idx}`);
        })
    });
};
const EmptyAttributes = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Box, {
        position: "relative",
        children: [
            /*#__PURE__*/ jsx(EmptyCardGrid, {}),
            /*#__PURE__*/ jsx(Box, {
                position: "absolute",
                top: 6,
                width: "100%",
                children: /*#__PURE__*/ jsxs(Flex, {
                    alignItems: "center",
                    justifyContent: "center",
                    direction: "column",
                    children: [
                        /*#__PURE__*/ jsx(EmptyDocuments, {
                            width: "160px",
                            height: "88px"
                        }),
                        /*#__PURE__*/ jsx(Box, {
                            paddingTop: 6,
                            paddingBottom: 4,
                            children: /*#__PURE__*/ jsxs(Box, {
                                textAlign: "center",
                                children: [
                                    /*#__PURE__*/ jsx(Typography, {
                                        variant: "delta",
                                        tag: "p",
                                        textColor: "neutral600",
                                        children: formatMessage({
                                            id: getTrad('modalForm.empty.heading'),
                                            defaultMessage: 'Nothing in here yet.'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Box, {
                                        paddingTop: 4,
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            variant: "delta",
                                            tag: "p",
                                            textColor: "neutral600",
                                            children: formatMessage({
                                                id: getTrad('modalForm.empty.sub-heading'),
                                                defaultMessage: 'Find what you are looking for through a wide range of extensions.'
                                            })
                                        })
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsx(LinkButton, {
                            tag: Link,
                            to: `/marketplace?${qs.stringify({
                                categories: [
                                    'Custom fields'
                                ]
                            })}`,
                            variant: "secondary",
                            startIcon: /*#__PURE__*/ jsx(Plus, {}),
                            children: formatMessage({
                                id: getTrad('modalForm.empty.button'),
                                defaultMessage: 'Add custom fields'
                            })
                        })
                    ]
                })
            })
        ]
    });
};

export { EmptyAttributes, EmptyCardGrid };
//# sourceMappingURL=EmptyAttributes.mjs.map
