import { jsx } from 'react/jsx-runtime';
import 'react';
import { Box } from '@strapi/design-system';
import { RESPONSIVE_DEFAULT_SPACING } from '../../constants/theme.mjs';

const ContentLayout = ({ children })=>{
    return /*#__PURE__*/ jsx(Box, {
        paddingLeft: RESPONSIVE_DEFAULT_SPACING,
        paddingRight: RESPONSIVE_DEFAULT_SPACING,
        children: children
    });
};

export { ContentLayout };
//# sourceMappingURL=ContentLayout.mjs.map
