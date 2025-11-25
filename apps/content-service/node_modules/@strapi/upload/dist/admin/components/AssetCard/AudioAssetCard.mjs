import { jsx } from 'react/jsx-runtime';
import { Box, CardAsset, Flex } from '@strapi/design-system';
import { styled } from 'styled-components';
import { AssetCardBase } from './AssetCardBase.mjs';
import { AudioPreview } from './AudioPreview.mjs';

const AudioPreviewWrapper = styled(Box)`
  canvas,
  audio {
    display: block;
    max-width: 100%;
    max-height: ${({ size })=>size === 'M' ? 16.4 : 8.8}rem;
  }
`;
const AudioAssetCard = ({ name, url, size = 'M', selected = false, ...restProps })=>{
    return /*#__PURE__*/ jsx(AssetCardBase, {
        name: name,
        selected: selected,
        ...restProps,
        variant: "Audio",
        children: /*#__PURE__*/ jsx(CardAsset, {
            size: size,
            children: /*#__PURE__*/ jsx(Flex, {
                alignItems: "center",
                children: /*#__PURE__*/ jsx(AudioPreviewWrapper, {
                    size: size,
                    children: /*#__PURE__*/ jsx(AudioPreview, {
                        url: url,
                        alt: name
                    })
                })
            })
        })
    });
};

export { AudioAssetCard };
//# sourceMappingURL=AudioAssetCard.mjs.map
