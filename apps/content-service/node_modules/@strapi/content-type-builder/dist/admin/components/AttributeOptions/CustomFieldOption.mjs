import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Flex, Box, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { AttributeIcon } from '../AttributeIcon.mjs';
import { useFormModalNavigation } from '../FormModalNavigation/useFormModalNavigation.mjs';
import { OptionBoxWrapper } from './OptionBoxWrapper.mjs';

const CustomFieldOption = ({ customFieldUid, customField })=>{
    const { type, intlLabel, intlDescription } = customField;
    const { formatMessage } = useIntl();
    const { onClickSelectCustomField } = useFormModalNavigation();
    const handleClick = ()=>{
        onClickSelectCustomField({
            attributeType: type,
            customFieldUid
        });
    };
    return /*#__PURE__*/ jsx(OptionBoxWrapper, {
        padding: 4,
        tag: "button",
        hasRadius: true,
        type: "button",
        onClick: handleClick,
        children: /*#__PURE__*/ jsxs(Flex, {
            children: [
                /*#__PURE__*/ jsx(AttributeIcon, {
                    type: type,
                    customField: customFieldUid
                }),
                /*#__PURE__*/ jsxs(Box, {
                    paddingLeft: 4,
                    children: [
                        /*#__PURE__*/ jsx(Flex, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                fontWeight: "bold",
                                textColor: "neutral800",
                                children: formatMessage(intlLabel)
                            })
                        }),
                        /*#__PURE__*/ jsx(Flex, {
                            children: /*#__PURE__*/ jsx(Typography, {
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

export { CustomFieldOption };
//# sourceMappingURL=CustomFieldOption.mjs.map
