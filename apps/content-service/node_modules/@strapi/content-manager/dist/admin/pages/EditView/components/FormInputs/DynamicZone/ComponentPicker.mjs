import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Box, Flex, Typography, Accordion } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../../../utils/translations.mjs';
import { ComponentCategory } from './ComponentCategory.mjs';

const ComponentPicker = ({ dynamicComponentsByCategory = {}, isOpen, onClickAddComponent })=>{
    const { formatMessage } = useIntl();
    const handleAddComponentToDz = (componentUid)=>()=>{
            onClickAddComponent(componentUid);
        };
    if (!isOpen) {
        return null;
    }
    return /*#__PURE__*/ jsxs(Box, {
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 5,
        paddingRight: 5,
        background: "neutral0",
        shadow: "tableShadow",
        borderColor: "neutral150",
        hasRadius: true,
        children: [
            /*#__PURE__*/ jsx(Flex, {
                justifyContent: "center",
                children: /*#__PURE__*/ jsx(Typography, {
                    fontWeight: "bold",
                    textColor: "neutral600",
                    children: formatMessage({
                        id: getTranslation('components.DynamicZone.ComponentPicker-label'),
                        defaultMessage: 'Pick one component'
                    })
                })
            }),
            /*#__PURE__*/ jsx(Box, {
                paddingTop: 2,
                children: /*#__PURE__*/ jsx(Accordion.Root, {
                    defaultValue: Object.keys(dynamicComponentsByCategory)[0],
                    children: Object.entries(dynamicComponentsByCategory).map(([category, components], index)=>/*#__PURE__*/ jsx(ComponentCategory, {
                            category: category,
                            components: components,
                            onAddComponent: handleAddComponentToDz,
                            variant: index % 2 === 1 ? 'primary' : 'secondary'
                        }, category))
                })
            })
        ]
    });
};

export { ComponentPicker };
//# sourceMappingURL=ComponentPicker.mjs.map
