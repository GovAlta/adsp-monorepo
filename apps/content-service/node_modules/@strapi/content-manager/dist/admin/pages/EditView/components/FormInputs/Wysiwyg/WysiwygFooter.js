'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var WysiwygStyles = require('./WysiwygStyles.js');

const WysiwygFooter = ({ onToggleExpand })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: 2,
        background: "neutral100",
        borderRadius: `0 0 0.4rem 0.4rem`,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            justifyContent: "flex-end",
            alignItems: "flex-end",
            children: /*#__PURE__*/ jsxRuntime.jsxs(WysiwygStyles.ExpandButton, {
                id: "expand",
                onClick: onToggleExpand,
                variant: "tertiary",
                size: "M",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        textColor: "neutral800",
                        children: formatMessage({
                            id: 'components.WysiwygBottomControls.fullscreen',
                            defaultMessage: 'Expand'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Icons.Expand, {})
                ]
            })
        })
    });
};

exports.WysiwygFooter = WysiwygFooter;
//# sourceMappingURL=WysiwygFooter.js.map
