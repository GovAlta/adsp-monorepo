import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Flex, Typography } from '@strapi/design-system';
import { Expand } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ExpandButton } from './WysiwygStyles.mjs';

const WysiwygFooter = ({ onToggleExpand })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Box, {
        padding: 2,
        background: "neutral100",
        borderRadius: `0 0 0.4rem 0.4rem`,
        children: /*#__PURE__*/ jsx(Flex, {
            justifyContent: "flex-end",
            alignItems: "flex-end",
            children: /*#__PURE__*/ jsxs(ExpandButton, {
                id: "expand",
                onClick: onToggleExpand,
                variant: "tertiary",
                size: "M",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        textColor: "neutral800",
                        children: formatMessage({
                            id: 'components.WysiwygBottomControls.fullscreen',
                            defaultMessage: 'Expand'
                        })
                    }),
                    /*#__PURE__*/ jsx(Expand, {})
                ]
            })
        })
    });
};

export { WysiwygFooter };
//# sourceMappingURL=WysiwygFooter.mjs.map
