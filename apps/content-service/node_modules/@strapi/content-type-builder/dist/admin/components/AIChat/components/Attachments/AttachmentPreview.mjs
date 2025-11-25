import { jsx, jsxs } from 'react/jsx-runtime';
import { Loader } from '@strapi/design-system';
import { Folder } from '@strapi/icons';
import { styled } from 'styled-components';
import { STRAPI_CODE_MIME_TYPE } from '../../lib/constants.mjs';
import { Base64Img } from '../Base64Image.mjs';
import { FullScreenImage } from '../FullScreenImage.mjs';
import { Attachment } from './components/Attachment.mjs';

/* -------------------------------------------------------------------------------------------------
 * Image
 * -----------------------------------------------------------------------------------------------*/ const ImageThumbnail = styled(Base64Img)`
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: ${({ theme })=>theme.borderRadius};
`;
const ImageAttachment = ({ attachment, onRemove, ...props })=>{
    return /*#__PURE__*/ jsx(FullScreenImage.Root, {
        src: attachment.url,
        alt: attachment.filename || 'image',
        children: /*#__PURE__*/ jsx(FullScreenImage.Trigger, {
            asChild: true,
            children: /*#__PURE__*/ jsxs(Attachment.Root, {
                ...props,
                children: [
                    /*#__PURE__*/ jsx(Attachment.Preview, {
                        children: attachment.status === 'loading' ? /*#__PURE__*/ jsx(Loader, {
                            small: true
                        }) : /*#__PURE__*/ jsx(ImageThumbnail, {
                            src: attachment.url,
                            alt: attachment.filename
                        })
                    }),
                    /*#__PURE__*/ jsx(Attachment.Title, {
                        children: attachment.filename || 'unknown'
                    }),
                    onRemove && /*#__PURE__*/ jsx(Attachment.Remove, {
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
    return /*#__PURE__*/ jsxs(Attachment.Root, {
        ...props,
        children: [
            /*#__PURE__*/ jsx(Attachment.Preview, {
                children: attachment.status === 'loading' ? /*#__PURE__*/ jsx(Loader, {
                    small: true
                }) : /*#__PURE__*/ jsx(Folder, {
                    height: 24,
                    width: 24
                })
            }),
            /*#__PURE__*/ jsx(Attachment.Title, {
                children: attachment.filename || 'unknown'
            }),
            onRemove && /*#__PURE__*/ jsx(Attachment.Remove, {
                onClick: onRemove
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Export
 * -----------------------------------------------------------------------------------------------*/ const AttachmentPreview = ({ attachment, onRemove, ...props })=>{
    if (attachment.mediaType?.startsWith('image/')) {
        return /*#__PURE__*/ jsx(ImageAttachment, {
            attachment: attachment,
            onRemove: onRemove,
            ...props
        });
    }
    if (attachment.mediaType === STRAPI_CODE_MIME_TYPE) {
        return /*#__PURE__*/ jsx(CodeAttachment, {
            attachment: attachment,
            onRemove: onRemove,
            ...props
        });
    }
    return null;
};

export { AttachmentPreview };
//# sourceMappingURL=AttachmentPreview.mjs.map
