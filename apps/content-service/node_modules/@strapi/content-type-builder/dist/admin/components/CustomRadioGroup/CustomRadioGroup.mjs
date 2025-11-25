import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Typography, Box } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Wrapper } from './Styles.mjs';

const CustomRadioGroup = ({ intlLabel, name, onChange, radios = [], value })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "pi",
                fontWeight: "bold",
                textColor: "neutral800",
                htmlFor: name,
                tag: "label",
                children: formatMessage(intlLabel)
            }),
            /*#__PURE__*/ jsx(Wrapper, {
                gap: 4,
                alignItems: "stretch",
                children: radios.map((radio)=>{
                    return /*#__PURE__*/ jsxs("label", {
                        htmlFor: radio.value.toString(),
                        className: "container",
                        children: [
                            /*#__PURE__*/ jsx("input", {
                                id: radio.value.toString(),
                                name: name,
                                className: "option-input",
                                checked: radio.value === value,
                                value: radio.value,
                                onChange: onChange,
                                type: "radio"
                            }, radio.value),
                            /*#__PURE__*/ jsx(Box, {
                                className: "option",
                                padding: 4,
                                children: /*#__PURE__*/ jsxs(Flex, {
                                    children: [
                                        /*#__PURE__*/ jsx(Box, {
                                            paddingRight: 4,
                                            children: /*#__PURE__*/ jsx("span", {
                                                className: "checkmark"
                                            })
                                        }),
                                        /*#__PURE__*/ jsxs(Flex, {
                                            direction: "column",
                                            alignItems: "stretch",
                                            gap: 2,
                                            children: [
                                                /*#__PURE__*/ jsx(Typography, {
                                                    fontWeight: "bold",
                                                    children: formatMessage(radio.title)
                                                }),
                                                /*#__PURE__*/ jsx(Typography, {
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

export { CustomRadioGroup };
//# sourceMappingURL=CustomRadioGroup.mjs.map
