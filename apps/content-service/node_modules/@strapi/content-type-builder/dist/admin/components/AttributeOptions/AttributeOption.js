'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var getTrad = require('../../utils/getTrad.js');
var AttributeIcon = require('../AttributeIcon.js');
var useFormModalNavigation = require('../FormModalNavigation/useFormModalNavigation.js');
var OptionBoxWrapper = require('./OptionBoxWrapper.js');

const newAttributes = [];
const NewBadge = ()=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        grow: 1,
        justifyContent: "flex-end",
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 1,
            hasRadius: true,
            background: "alternative100",
            padding: `0.2rem 0.4rem`,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(Icons.Sparkle, {
                    width: `1rem`,
                    height: `1rem`,
                    fill: "alternative600"
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    textColor: "alternative600",
                    variant: "sigma",
                    children: "New"
                })
            ]
        })
    });
const AttributeOption = ({ type = 'text' })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { onClickSelectField } = useFormModalNavigation.useFormModalNavigation();
    const handleClick = ()=>{
        const step = type === 'component' ? '1' : null;
        onClickSelectField({
            attributeType: type,
            step
        });
    };
    return /*#__PURE__*/ jsxRuntime.jsx(OptionBoxWrapper.OptionBoxWrapper, {
        padding: 4,
        tag: "button",
        hasRadius: true,
        type: "button",
        onClick: handleClick,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(AttributeIcon.AttributeIcon, {
                    type: type
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                    paddingLeft: 4,
                    width: "100%",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            justifyContent: "space-between",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    fontWeight: "bold",
                                    textColor: "neutral800",
                                    children: formatMessage({
                                        id: getTrad.getTrad(`attribute.${type}`),
                                        defaultMessage: type
                                    })
                                }),
                                newAttributes.includes(type) && /*#__PURE__*/ jsxRuntime.jsx(NewBadge, {})
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "pi",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTrad.getTrad(`attribute.${type}.description`),
                                    defaultMessage: 'A type for modeling data'
                                })
                            })
                        })
                    ]
                })
            ]
        })
    });
};

exports.AttributeOption = AttributeOption;
//# sourceMappingURL=AttributeOption.js.map
