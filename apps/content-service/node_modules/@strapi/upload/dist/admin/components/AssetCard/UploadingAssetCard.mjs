import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Card, CardHeader, CardBody, CardContent, Box, Typography, CardTitle, CardSubtitle, CardBadge } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { AssetType } from '../../constants.mjs';
import { useUpload } from '../../hooks/useUpload.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../utils/urlYupSchema.mjs';
import { UploadProgress } from '../UploadProgress/UploadProgress.mjs';

const UploadProgressWrapper = styled.div`
  height: 8.8rem;
  width: 100%;
`;
const Extension = styled.span`
  text-transform: uppercase;
`;
const UploadingAssetCard = ({ asset, onCancel, onStatusChange, addUploadedFiles, folderId = null })=>{
    const { upload, cancel, error, progress, status } = useUpload();
    const { formatMessage } = useIntl();
    let badgeContent = formatMessage({
        id: getTrad('settings.section.doc.label'),
        defaultMessage: 'Doc'
    });
    if (asset.type === AssetType.Image) {
        badgeContent = formatMessage({
            id: getTrad('settings.section.image.label'),
            defaultMessage: 'Image'
        });
    } else if (asset.type === AssetType.Video) {
        badgeContent = formatMessage({
            id: getTrad('settings.section.video.label'),
            defaultMessage: 'Video'
        });
    } else if (asset.type === AssetType.Audio) {
        badgeContent = formatMessage({
            id: getTrad('settings.section.audio.label'),
            defaultMessage: 'Audio'
        });
    }
    React.useEffect(()=>{
        const uploadFile = async ()=>{
            const files = await upload(asset, folderId ? Number(folderId) : null);
            if (addUploadedFiles) {
                addUploadedFiles(files);
            }
        };
        uploadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    React.useEffect(()=>{
        onStatusChange(status);
    }, [
        status,
        onStatusChange
    ]);
    const handleCancel = ()=>{
        cancel();
        onCancel(asset.rawFile);
    };
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 1,
        children: [
            /*#__PURE__*/ jsxs(Card, {
                borderColor: error ? 'danger600' : 'neutral150',
                children: [
                    /*#__PURE__*/ jsx(CardHeader, {
                        children: /*#__PURE__*/ jsx(UploadProgressWrapper, {
                            children: /*#__PURE__*/ jsx(UploadProgress, {
                                error: error || undefined,
                                onCancel: handleCancel,
                                progress: progress
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxs(CardBody, {
                        children: [
                            /*#__PURE__*/ jsxs(CardContent, {
                                children: [
                                    /*#__PURE__*/ jsx(Box, {
                                        paddingTop: 1,
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            tag: "h2",
                                            children: /*#__PURE__*/ jsx(CardTitle, {
                                                tag: "span",
                                                children: asset.name
                                            })
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(CardSubtitle, {
                                        children: /*#__PURE__*/ jsx(Extension, {
                                            children: asset.ext
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(Flex, {
                                paddingTop: 1,
                                grow: 1,
                                children: /*#__PURE__*/ jsx(CardBadge, {
                                    children: badgeContent
                                })
                            })
                        ]
                    })
                ]
            }),
            error ? /*#__PURE__*/ jsx(Typography, {
                variant: "pi",
                fontWeight: "bold",
                textColor: "danger600",
                children: formatMessage(error?.message ? {
                    id: getTrad(`apiError.${error.message}`),
                    defaultMessage: error.message
                } : {
                    id: getTrad('upload.generic-error'),
                    defaultMessage: 'An error occured while uploading the file.'
                })
            }) : undefined
        ]
    });
};

export { UploadingAssetCard };
//# sourceMappingURL=UploadingAssetCard.mjs.map
