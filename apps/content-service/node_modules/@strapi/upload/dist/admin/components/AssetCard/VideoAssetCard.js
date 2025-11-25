'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');
require('byte-size');
var formatDuration = require('../../utils/formatDuration.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');
var AssetCardBase = require('./AssetCardBase.js');
var VideoPreview = require('./VideoPreview.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const VideoPreviewWrapper = styledComponents.styled(designSystem.Box)`
  canvas,
  video {
    display: block;
    pointer-events: none;
    max-width: 100%;
    max-height: ${({ size })=>size === 'M' ? 16.4 : 8.8}rem;
  }
`;
const VideoAssetCard = ({ name, url, mime, size = 'M', selected = false, ...props })=>{
    const [duration, setDuration] = React__namespace.useState();
    const formattedDuration = duration && formatDuration.formatDuration(duration);
    return /*#__PURE__*/ jsxRuntime.jsxs(AssetCardBase.AssetCardBase, {
        selected: selected,
        name: name,
        ...props,
        variant: "Video",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardAsset, {
                size: size,
                children: /*#__PURE__*/ jsxRuntime.jsx(VideoPreviewWrapper, {
                    size: size,
                    children: /*#__PURE__*/ jsxRuntime.jsx(VideoPreview.VideoPreview, {
                        url: url,
                        mime: mime,
                        onLoadDuration: setDuration,
                        alt: name
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardTimer, {
                children: formattedDuration || '...'
            })
        ]
    });
};

exports.VideoAssetCard = VideoAssetCard;
//# sourceMappingURL=VideoAssetCard.js.map
