'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var Styles = require('./Styles.js');

const CustomRadioGroup = ({ intlLabel, name, onChange, radios = [], value })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "pi",
                fontWeight: "bold",
                textColor: "neutral800",
                htmlFor: name,
                tag: "label",
                children: formatMessage(intlLabel)
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Styles.Wrapper, {
                gap: 4,
                alignItems: "stretch",
                children: radios.map((radio)=>{
                    return /*#__PURE__*/ jsxRuntime.jsxs("label", {
                        htmlFor: radio.value.toString(),
                        className: "container",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx("input", {
                                id: radio.value.toString(),
                                name: name,
                                className: "option-input",
                                checked: radio.value === value,
                                value: radio.value,
                                onChange: onChange,
                                type: "radio"
                            }, radio.value),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                className: "option",
                                padding: 4,
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                            paddingRight: 4,
                                            children: /*#__PURE__*/ jsxRuntime.jsx("span", {
                                                className: "checkmark"
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                            direction: "column",
                                            alignItems: "stretch",
                                            gap: 2,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    fontWeight: "bold",
                                                    children: formatMessage(radio.title)
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    variant: "pi",
                                                    textColor: "neutral600",
                                                    children: formatMessage(radio.description)
                                                })
                                            ]
                                        })
                                    ]
                                })
                            })
                        ]
                    }, radio.value);
                })
            })
        ]
    });
};

exports.CustomRadioGroup = CustomRadioGroup;
//# sourceMappingURL=CustomRadioGroup.js.map
