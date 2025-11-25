import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Flex, Typography } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';

const COLORS = {
    danger: {
        background: 'danger100',
        borderColor: 'danger200',
        textColor: 'danger700'
    },
    warning: {
        background: 'warning100',
        borderColor: 'warning200',
        textColor: 'warning600'
    }
};
const Alert = ({ title, variant = 'danger' })=>{
    return /*#__PURE__*/ jsx(Box, {
        padding: 3,
        background: COLORS[variant].background,
        borderColor: COLORS[variant].borderColor,
        hasRadius: true,
        width: "100%",
        children: /*#__PURE__*/ jsxs(Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsx(WarningCircle, {
                    style: {
                        minWidth: '16px'
                    },
                    fill: COLORS[variant].textColor
                }),
                /*#__PURE__*/ jsx(Typography, {
                    variant: "omega",
                    textColor: COLORS[variant].textColor,
                    children: title
                })
            ]
        })
    });
};

export { Alert };
//# sourceMappingURL=Alert.mjs.map
