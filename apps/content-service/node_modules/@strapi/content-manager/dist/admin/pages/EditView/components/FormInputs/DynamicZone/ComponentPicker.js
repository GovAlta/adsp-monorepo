'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var translations = require('../../../../../utils/translations.js');
var ComponentCategory = require('./ComponentCategory.js');

const ComponentPicker = ({ dynamicComponentsByCategory = {}, isOpen, onClickAddComponent })=>{
    const { formatMessage } = reactIntl.useIntl();
    const handleAddComponentToDz = (componentUid)=>()=>{
            onClickAddComponent(componentUid);
        };
    if (!isOpen) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 5,
        paddingRight: 5,
        background: "neutral0",
        shadow: "tableShadow",
        borderColor: "neutral150",
        hasRadius: true,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                justifyContent: "center",
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    fontWeight: "bold",
                    textColor: "neutral600",
                    children: formatMessage({
                        id: translations.getTranslation('components.DynamicZone.ComponentPicker-label'),
                        defaultMessage: 'Pick one component'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingTop: 2,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Root, {
                    defaultValue: Object.keys(dynamicComponentsByCategory)[0],
                    children: Object.entries(dynamicComponentsByCategory).map(([category, components], index)=>/*#__PURE__*/ jsxRuntime.jsx(ComponentCategory.ComponentCategory, {
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

exports.ComponentPicker = ComponentPicker;
//# sourceMappingURL=ComponentPicker.js.map
