import { jsx } from 'react/jsx-runtime';
import { Flex } from '@strapi/design-system';
import { COMPONENT_ICONS } from '../../IconPicker/constants.mjs';

const ComponentIcon = ({ isActive = false, icon = 'dashboard' })=>{
    const Icon = COMPONENT_ICONS[icon] || COMPONENT_ICONS.dashboard;
    return /*#__PURE__*/ jsx(Flex, {
        alignItems: "center",
        background: isActive ? 'primary200' : 'neutral200',
        justifyContent: "center",
        height: 8,
        width: 8,
        borderRadius: "50%",
        children: /*#__PURE__*/ jsx(Icon, {
            height: "2rem",
            width: "2rem"
        })
    });
};

export { ComponentIcon };
//# sourceMappingURL=ComponentIcon.mjs.map
