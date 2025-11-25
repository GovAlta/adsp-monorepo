import { jsxs, jsx } from 'react/jsx-runtime';
import { Box, Flex, Typography } from '@strapi/design-system';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { EmptyAssetGrid } from './EmptyAssetGrid.mjs';

// TODO: find a better naming convention for the file that was an index file before
const EmptyAssets = ({ icon: Icon = EmptyDocuments, content, action, size = 'M', count = 12 })=>{
    return /*#__PURE__*/ jsxs(Box, {
        position: "relative",
        children: [
            /*#__PURE__*/ jsx(EmptyAssetGrid, {
                size: size,
                count: count
            }),
            /*#__PURE__*/ jsx(Box, {
                position: "absolute",
                top: 11,
                width: "100%",
                children: /*#__PURE__*/ jsxs(Flex, {
                    direction: "column",
                    alignItems: "center",
                    gap: 4,
                    textAlign: "center",
                    children: [
                        /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            alignItems: "center",
                            gap: 6,
                            children: [
                                /*#__PURE__*/ jsx(Icon, {
                                    width: "160px",
                                    height: "88px"
                                }),
                                /*#__PURE__*/ jsx(Typography, {
                                    variant: "delta",
                                    tag: "p",
                                    textColor: "neutral600",
                                    children: content
                                })
                            ]
                        }),
                        action
                    ]
                })
            })
        ]
    });
};

export { EmptyAssets };
//# sourceMappingURL=EmptyAssets.mjs.map
