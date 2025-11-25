'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');
var constants = require('../../lib/constants.js');
var Base64Image = require('../Base64Image.js');
var FullScreenImage = require('../FullScreenImage.js');
var Attachment = require('./components/Attachment.js');

/* -------------------------------------------------------------------------------------------------
 * Image
 * -----------------------------------------------------------------------------------------------*/ const ImageThumbnail = styledComponents.styled(Base64Image.Base64Img)`
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: ${({ theme })=>theme.borderRadius};
`;
const ImageAttachment = ({ attachment, onRemove, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(FullScreenImage.FullScreenImage.Root, {
        src: attachment.url,
        alt: attachment.filename || 'image',
        children: /*#__PURE__*/ jsxRuntime.jsx(FullScreenImage.FullScreenImage.Trigger, {
            asChild: true,
            children: /*#__PURE__*/ jsxRuntime.jsxs(Attachment.Attachment.Root, {
                ...props,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(Attachment.Attachment.Preview, {
                        children: attachment.status === 'loading' ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                            small: true
                        }) : /*#__PURE__*/ jsxRuntime.jsx(ImageThumbnail, {
                            src: attachment.url,
                            alt: attachment.filename
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Attachment.Attachment.Title, {
                        children: attachment.filename || 'unknown'
                    }),
                    onRemove && /*#__PURE__*/ jsxRuntime.jsx(Attachment.Attachment.Remove, {
                        onClick: onRemove
                    })
                ]
            })
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Code
 * -----------------------------------------------------------------------------------------------*/ const CodeAttachment = ({ attachment, onRemove, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(Attachment.Attachment.Root, {
        ...props,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Attachment.Attachment.Preview, {
                children: attachment.status === 'loading' ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                    small: true
                }) : /*#__PURE__*/ jsxRuntime.jsx(Icons.Folder, {
                    height: 24,
                    width: 24
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Attachment.Attachment.Title, {
                children: attachment.filename || 'unknown'
            }),
            onRemove && /*#__PURE__*/ jsxRuntime.jsx(Attachment.Attachment.Remove, {
                onClick: onRemove
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Export
 * -----------------------------------------------------------------------------------------------*/ const AttachmentPreview = ({ attachment, onRemove, ...props })=>{
    if (attachment.mediaType?.startsWith('image/')) {
        return /*#__PURE__*/ jsxRuntime.jsx(ImageAttachment, {
            attachment: attachment,
            onRemove: onRemove,
            ...props
        });
    }
    if (attachment.mediaType === constants.STRAPI_CODE_MIME_TYPE) {
        return /*#__PURE__*/ jsxRuntime.jsx(CodeAttachment, {
            attachment: attachment,
            onRemove: onRemove,
            ...props
        });
    }
    return null;
};

exports.AttachmentPreview = AttachmentPreview;
//# sourceMappingURL=AttachmentPreview.js.map
