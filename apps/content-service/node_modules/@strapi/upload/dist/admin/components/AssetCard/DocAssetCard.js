'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var AssetCardBase = require('./AssetCardBase.js');

const CardAsset = styledComponents.styled(designSystem.Flex)`
  border-radius: ${({ theme })=>theme.borderRadius} ${({ theme })=>theme.borderRadius} 0 0;
  background: linear-gradient(
    180deg,
    ${({ theme })=>theme.colors.neutral0} 0%,
    ${({ theme })=>theme.colors.neutral100} 121.48%
  );
`;
const DocAssetCard = ({ name, extension, size = 'M', selected = false, ...restProps })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(AssetCardBase.AssetCardBase, {
        name: name,
        extension: extension,
        selected: selected,
        ...restProps,
        variant: "Doc",
        children: /*#__PURE__*/ jsxRuntime.jsx(CardAsset, {
            width: "100%",
            height: size === 'S' ? `8.8rem` : `16.4rem`,
            justifyContent: "center",
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                direction: "column",
                alignItems: "center",
                children: [
                    extension === 'pdf' ? /*#__PURE__*/ jsxRuntime.jsx(icons.FilePdf, {
                        "aria-label": name,
                        fill: "neutral500",
                        width: 24,
                        height: 24
                    }) : /*#__PURE__*/ jsxRuntime.jsx(icons.File, {
                        "aria-label": name,
                        fill: "neutral500",
                        width: 24,
                        height: 24
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        textColor: "neutral500",
                        variant: "pi",
                        children: formatMessage({
                            id: 'noPreview',
                            defaultMessage: 'No preview available'
                        })
                    })
                ]
            })
        })
    });
};

exports.DocAssetCard = DocAssetCard;
//# sourceMappingURL=DocAssetCard.js.map
