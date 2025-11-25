import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Grid, Flex, Typography } from '@strapi/design-system';

const ContextInfo = ({ blocks })=>{
    return /*#__PURE__*/ jsx(Box, {
        hasRadius: true,
        paddingLeft: 6,
        paddingRight: 6,
        paddingTop: 4,
        paddingBottom: 4,
        background: "neutral100",
        children: /*#__PURE__*/ jsx(Grid.Root, {
            gap: 4,
            children: blocks.map(({ label, value })=>/*#__PURE__*/ jsx(Grid.Item, {
                    col: 6,
                    xs: 12,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxs(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 1,
                        children: [
                            /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: label
                            }),
                            /*#__PURE__*/ jsx(Typography, {
                                variant: "pi",
                                textColor: "neutral700",
                                children: value
                            })
                        ]
                    })
                }, label))
        })
    });
};

export { ContextInfo };
//# sourceMappingURL=ContextInfo.mjs.map
