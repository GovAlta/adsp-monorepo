import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, CardAsset, CardTimer } from '@strapi/design-system';
import { styled } from 'styled-components';
import 'byte-size';
import { formatDuration } from '../../utils/formatDuration.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';
import { AssetCardBase } from './AssetCardBase.mjs';
import { VideoPreview } from './VideoPreview.mjs';

const VideoPreviewWrapper = styled(Box)`
  canvas,
  video {
    display: block;
    pointer-events: none;
    max-width: 100%;
    max-height: ${({ size })=>size === 'M' ? 16.4 : 8.8}rem;
  }
`;
const VideoAssetCard = ({ name, url, mime, size = 'M', selected = false, ...props })=>{
    const [duration, setDuration] = React.useState();
    const formattedDuration = duration && formatDuration(duration);
    return /*#__PURE__*/ jsxs(AssetCardBase, {
        selected: selected,
        name: name,
        ...props,
        variant: "Video",
        children: [
            /*#__PURE__*/ jsx(CardAsset, {
                size: size,
                children: /*#__PURE__*/ jsx(VideoPreviewWrapper, {
                    size: size,
                    children: /*#__PURE__*/ jsx(VideoPreview, {
                        url: url,
                        mime: mime,
                        onLoadDuration: setDuration,
                        alt: name
                    })
                })
            }),
            /*#__PURE__*/ jsx(CardTimer, {
                children: formattedDuration || '...'
            })
        ]
    });
};

export { VideoAssetCard };
//# sourceMappingURL=VideoAssetCard.mjs.map
