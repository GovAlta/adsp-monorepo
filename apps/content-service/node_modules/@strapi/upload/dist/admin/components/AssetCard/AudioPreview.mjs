import { jsx } from 'react/jsx-runtime';
import { Box } from '@strapi/design-system';

const AudioPreview = ({ url, alt })=>{
    return /*#__PURE__*/ jsx(Box, {
        children: /*#__PURE__*/ jsx("audio", {
            controls: true,
            src: url,
            children: alt
        })
    });
};

export { AudioPreview };
//# sourceMappingURL=AudioPreview.mjs.map
