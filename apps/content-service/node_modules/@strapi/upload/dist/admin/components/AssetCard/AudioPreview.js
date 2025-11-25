'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');

const AudioPreview = ({ url, alt })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        children: /*#__PURE__*/ jsxRuntime.jsx("audio", {
            controls: true,
            src: url,
            children: alt
        })
    });
};

exports.AudioPreview = AudioPreview;
//# sourceMappingURL=AudioPreview.js.map
