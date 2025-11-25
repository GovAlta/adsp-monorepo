'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var AttributeIcon = require('../AttributeIcon.js');
var useFormModalNavigation = require('../FormModalNavigation/useFormModalNavigation.js');
var OptionBoxWrapper = require('./OptionBoxWrapper.js');

const CustomFieldOption = ({ customFieldUid, customField })=>{
    const { type, intlLabel, intlDescription } = customField;
    const { formatMessage } = reactIntl.useIntl();
    const { onClickSelectCustomField } = useFormModalNavigation.useFormModalNavigation();
    const handleClick = ()=>{
        onClickSelectCustomField({
            attributeType: type,
            customFieldUid
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
                    type: type,
                    customField: customFieldUid
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                    paddingLeft: 4,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                fontWeight: "bold",
                                textColor: "neutral800",
                                children: formatMessage(intlLabel)
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "pi",
                                textColor: "neutral600",
                                children: formatMessage(intlDescription)
                            })
                        })
                    ]
                })
            ]
        })
    });
};

exports.CustomFieldOption = CustomFieldOption;
//# sourceMappingURL=CustomFieldOption.js.map
