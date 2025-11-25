import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Flex, Box, Typography } from '@strapi/design-system';

const DynamicZoneLabel = ({ hint, label, labelAction, name, numberOfComponents = 0, required })=>{
    return /*#__PURE__*/ jsx(Flex, {
        justifyContent: "center",
        children: /*#__PURE__*/ jsx(Box, {
            paddingTop: 3,
            paddingBottom: 3,
            paddingRight: 4,
            paddingLeft: 4,
            borderRadius: "26px",
            background: "neutral0",
            shadow: "filterShadow",
            color: "neutral500",
            children: /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                justifyContent: "center",
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        maxWidth: "35.6rem",
                        children: [
                            /*#__PURE__*/ jsxs(Typography, {
                                variant: "pi",
                                textColor: "neutral600",
                                fontWeight: "bold",
                                ellipsis: true,
                                children: [
                                    label || name,
                                    " "
                                ]
                            }),
                            /*#__PURE__*/ jsxs(Typography, {
                                variant: "pi",
                                textColor: "neutral600",
                                fontWeight: "bold",
                                children: [
                                    "(",
                                    numberOfComponents,
                                    ")"
                                ]
                            }),
                            required && /*#__PURE__*/ jsx(Typography, {
                                textColor: "danger600",
                                children: "*"
                            }),
                            labelAction && /*#__PURE__*/ jsx(Box, {
                                paddingLeft: 1,
                                children: labelAction
                            })
                        ]
                    }),
                    hint && /*#__PURE__*/ jsx(Box, {
                        paddingTop: 1,
                        maxWidth: "35.6rem",
                        children: /*#__PURE__*/ jsx(Typography, {
                            variant: "pi",
                            textColor: "neutral600",
                            ellipsis: true,
                            children: hint
                        })
                    })
                ]
            })
        })
    });
};

export { DynamicZoneLabel };
//# sourceMappingURL=DynamicZoneLabel.mjs.map
