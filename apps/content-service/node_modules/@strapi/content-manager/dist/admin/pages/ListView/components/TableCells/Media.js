'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');
var urls = require('../../../../utils/urls.js');

const getFileExtension = (ext)=>ext && ext[0] === '.' ? ext.substring(1) : ext;
const MediaSingle = ({ url, mime, alternativeText, name, ext, formats })=>{
    const fileURL = urls.prefixFileUrlWithBackendUrl(url);
    if (mime.includes('image')) {
        const thumbnail = formats?.thumbnail?.url;
        const mediaURL = urls.prefixFileUrlWithBackendUrl(thumbnail) || fileURL;
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Avatar.Item, {
            src: mediaURL,
            alt: alternativeText || name,
            fallback: alternativeText || name,
            preview: true
        });
    }
    const fileExtension = getFileExtension(ext);
    const fileName = name.length > 100 ? `${name.substring(0, 100)}...` : name;
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
        description: fileName,
        children: /*#__PURE__*/ jsxRuntime.jsx(FileWrapper, {
            children: fileExtension
        })
    });
};
const FileWrapper = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        tag: "span",
        position: "relative",
        borderRadius: "50%",
        width: "26px",
        height: "26px",
        borderColor: "neutral200",
        background: "neutral150",
        paddingLeft: "1px",
        justifyContent: "center",
        alignItems: "center",
        children: /*#__PURE__*/ jsxRuntime.jsx(FileTypography, {
            variant: "sigma",
            textColor: "neutral600",
            children: children
        })
    });
};
const FileTypography = styledComponents.styled(designSystem.Typography)`
  font-size: 0.9rem;
  line-height: 0.9rem;
`;
const MediaMultiple = ({ content })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Avatar.Group, {
        children: content.map((file, index)=>{
            const key = `${file.id}${index}`;
            if (index === 3) {
                const remainingFiles = `+${content.length - 3}`;
                return /*#__PURE__*/ jsxRuntime.jsx(FileWrapper, {
                    children: remainingFiles
                }, key);
            }
            if (index > 3) {
                return null;
            }
            return /*#__PURE__*/ jsxRuntime.jsx(MediaSingle, {
                ...file
            }, key);
        })
    });
};

exports.MediaMultiple = MediaMultiple;
exports.MediaSingle = MediaSingle;
//# sourceMappingURL=Media.js.map
