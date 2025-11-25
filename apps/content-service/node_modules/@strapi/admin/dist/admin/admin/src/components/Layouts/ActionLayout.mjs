import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Flex } from '@strapi/design-system';
import { RESPONSIVE_DEFAULT_SPACING } from '../../constants/theme.mjs';

const ActionLayout = ({ startActions, endActions })=>{
    if (!startActions && !endActions) {
        return null;
    }
    return /*#__PURE__*/ jsxs(Flex, {
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingBottom: 4,
        paddingLeft: RESPONSIVE_DEFAULT_SPACING,
        paddingRight: RESPONSIVE_DEFAULT_SPACING,
        children: [
            /*#__PURE__*/ jsx(Flex, {
                gap: 2,
                wrap: "wrap",
                children: startActions
            }),
            /*#__PURE__*/ jsx(Flex, {
                gap: 2,
                shrink: 0,
                wrap: "wrap",
                children: endActions
            })
        ]
    });
};

export { ActionLayout };
//# sourceMappingURL=ActionLayout.mjs.map
