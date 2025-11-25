'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');
var AssetCardBase = require('./AssetCardBase.js');
var AudioPreview = require('./AudioPreview.js');

const AudioPreviewWrapper = styledComponents.styled(designSystem.Box)`
  canvas,
  audio {
    display: block;
    max-width: 100%;
    max-height: ${({ size })=>size === 'M' ? 16.4 : 8.8}rem;
  }
`;
const AudioAssetCard = ({ name, url, size = 'M', selected = false, ...restProps })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(AssetCardBase.AssetCardBase, {
        name: name,
        selected: selected,
        ...restProps,
        variant: "Audio",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardAsset, {
            size: size,
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                alignItems: "center",
                children: /*#__PURE__*/ jsxRuntime.jsx(AudioPreviewWrapper, {
                    size: size,
                    children: /*#__PURE__*/ jsxRuntime.jsx(AudioPreview.AudioPreview, {
                        url: url,
                        alt: name
                    })
                })
            })
        })
    });
};

exports.AudioAssetCard = AudioAssetCard;
//# sourceMappingURL=AudioAssetCard.js.map
