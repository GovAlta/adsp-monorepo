import { jsx, jsxs } from 'react/jsx-runtime';
import { Flex, Box, Typography } from '@strapi/design-system';
import { Sparkle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTrad } from '../../utils/getTrad.mjs';
import { AttributeIcon } from '../AttributeIcon.mjs';
import { useFormModalNavigation } from '../FormModalNavigation/useFormModalNavigation.mjs';
import { OptionBoxWrapper } from './OptionBoxWrapper.mjs';

const newAttributes = [];
const NewBadge = ()=>/*#__PURE__*/ jsx(Flex, {
        grow: 1,
        justifyContent: "flex-end",
        children: /*#__PURE__*/ jsxs(Flex, {
            gap: 1,
            hasRadius: true,
            background: "alternative100",
            padding: `0.2rem 0.4rem`,
            children: [
                /*#__PURE__*/ jsx(Sparkle, {
                    width: `1rem`,
                    height: `1rem`,
                    fill: "alternative600"
                }),
                /*#__PURE__*/ jsx(Typography, {
                    textColor: "alternative600",
                    variant: "sigma",
                    children: "New"
                })
            ]
        })
    });
const AttributeOption = ({ type = 'text' })=>{
    const { formatMessage } = useIntl();
    const { onClickSelectField } = useFormModalNavigation();
    const handleClick = ()=>{
        const step = type === 'component' ? '1' : null;
        onClickSelectField({
            attributeType: type,
            step
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
                    type: type
                }),
                /*#__PURE__*/ jsxs(Box, {
                    paddingLeft: 4,
                    width: "100%",
                    children: [
                        /*#__PURE__*/ jsxs(Flex, {
                            justifyContent: "space-between",
                            children: [
                                /*#__PURE__*/ jsx(Typography, {
                                    fontWeight: "bold",
                                    textColor: "neutral800",
                                    children: formatMessage({
                                        id: getTrad(`attribute.${type}`),
                                        defaultMessage: type
                                    })
                                }),
                                newAttributes.includes(type) && /*#__PURE__*/ jsx(NewBadge, {})
                            ]
                        }),
                        /*#__PURE__*/ jsx(Flex, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "pi",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTrad(`attribute.${type}.description`),
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

export { AttributeOption };
//# sourceMappingURL=AttributeOption.mjs.map
