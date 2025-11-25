import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Typography } from '@strapi/design-system';
import { CaretDown } from '@strapi/icons';

const StageDragPreview = ({ name })=>{
    return /*#__PURE__*/ jsxs(Flex, {
        background: "primary100",
        borderStyle: "dashed",
        borderColor: "primary600",
        borderWidth: "1px",
        gap: 3,
        hasRadius: true,
        padding: 3,
        shadow: "tableShadow",
        width: "30rem",
        children: [
            /*#__PURE__*/ jsx(Flex, {
                alignItems: "center",
                background: "neutral200",
                borderRadius: "50%",
                height: 6,
                justifyContent: "center",
                width: 6,
                children: /*#__PURE__*/ jsx(CaretDown, {
                    width: "0.8rem",
                    fill: "neutral600"
                })
            }),
            /*#__PURE__*/ jsx(Typography, {
                fontWeight: "bold",
                children: name
            })
        ]
    });
};

export { StageDragPreview };
//# sourceMappingURL=StageDragPreview.mjs.map
