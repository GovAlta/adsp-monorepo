import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking } from '@strapi/admin/strapi-admin';
import { Flex, IconButton } from '@strapi/design-system';
import { Trash, Download, Crop } from '@strapi/icons';
import cropperjscss from 'cropperjs/dist/cropper.css?raw';
import { useIntl } from 'react-intl';
import { createGlobalStyle } from 'styled-components';
import { AssetType } from '../../../constants.mjs';
import { useCropImg } from '../../../hooks/useCropImg.mjs';
import { useEditAsset } from '../../../hooks/useEditAsset.mjs';
import { useUpload } from '../../../hooks/useUpload.mjs';
import { createAssetUrl } from '../../../utils/createAssetUrl.mjs';
import { downloadFile } from '../../../utils/downloadFile.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../utils/urlYupSchema.mjs';
import { CopyLinkButton } from '../../CopyLinkButton/CopyLinkButton.mjs';
import { UploadProgress } from '../../UploadProgress/UploadProgress.mjs';
import { RemoveAssetDialog } from '../RemoveAssetDialog.mjs';
import { AssetPreview } from './AssetPreview.mjs';
import { CroppingActions } from './CroppingActions.mjs';
import { RelativeBox, ActionRow, Wrapper, UploadProgressWrapper, BadgeOverride } from './PreviewComponents.mjs';

// TODO: find a better naming convention for the file that was an index file before
const PreviewBox = ({ asset, canUpdate, canCopyLink, canDownload, onDelete, onCropFinish, onCropStart, onCropCancel, replacementFile, trackedLocation })=>{
    const CropperjsStyle = createGlobalStyle`${cropperjscss}`;
    const { trackUsage } = useTracking();
    const previewRef = React.useRef(null);
    const [isCropImageReady, setIsCropImageReady] = React.useState(false);
    const [hasCropIntent, setHasCropIntent] = React.useState(null);
    const [assetUrl, setAssetUrl] = React.useState(createAssetUrl(asset, false));
    const [thumbnailUrl, setThumbnailUrl] = React.useState(createAssetUrl(asset, true));
    const { formatMessage } = useIntl();
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
    const { crop, produceFile, stopCropping, isCropping, isCropperReady, width, height } = useCropImg();
    const { editAsset, error, isLoading, progress, cancel } = useEditAsset();
    const { upload, isLoading: isLoadingUpload, cancel: cancelUpload, error: uploadError, progress: progressUpload } = useUpload();
    React.useEffect(()=>{
        // Whenever a replacementUrl is set, make sure to permutate the real asset.url by
        // the locally generated one
        if (replacementFile) {
            const fileLocalUrl = URL.createObjectURL(replacementFile);
            if (asset.isLocal) {
                asset.url = fileLocalUrl;
            }
            setAssetUrl(fileLocalUrl);
            setThumbnailUrl(fileLocalUrl);
        }
    }, [
        replacementFile,
        asset
    ]);
    React.useEffect(()=>{
        if (hasCropIntent === false) {
            stopCropping();
            onCropCancel();
        }
    }, [
        hasCropIntent,
        stopCropping,
        onCropCancel,
        onCropFinish
    ]);
    React.useEffect(()=>{
        if (hasCropIntent && isCropImageReady) {
            crop(previewRef.current);
            onCropStart();
        }
    }, [
        isCropImageReady,
        hasCropIntent,
        onCropStart,
        crop
    ]);
    const handleCropping = async ()=>{
        const nextAsset = {
            ...asset,
            width,
            height,
            folder: asset.folder?.id
        };
        const file = await produceFile(nextAsset.name, nextAsset.mime, nextAsset.updatedAt);
        // Making sure that when persisting the new asset, the URL changes with width and height
        // So that the browser makes a request and handle the image caching correctly at the good size
        let optimizedCachingImage;
        let optimizedCachingThumbnailImage;
        if (asset.isLocal) {
            optimizedCachingImage = URL.createObjectURL(file);
            optimizedCachingThumbnailImage = optimizedCachingImage;
            asset.url = optimizedCachingImage;
            asset.rawFile = file;
            trackUsage('didCropFile', {
                duplicatedFile: null,
                location: trackedLocation
            });
        } else {
            const updatedAsset = await editAsset(nextAsset, file);
            optimizedCachingImage = createAssetUrl(updatedAsset, false);
            optimizedCachingThumbnailImage = createAssetUrl(updatedAsset, true);
            trackUsage('didCropFile', {
                duplicatedFile: false,
                location: trackedLocation
            });
        }
        setAssetUrl(optimizedCachingImage);
        setThumbnailUrl(optimizedCachingThumbnailImage);
        setHasCropIntent(false);
    };
    const isInCroppingMode = isCropping && !isLoading;
    const handleDuplication = async ()=>{
        const nextAsset = {
            ...asset,
            width,
            height
        };
        const file = await produceFile(nextAsset.name, nextAsset.mime, nextAsset.updatedAt);
        await upload({
            name: file.name,
            rawFile: file
        }, asset.folder?.id ? asset.folder.id : null);
        trackUsage('didCropFile', {
            duplicatedFile: true,
            location: trackedLocation
        });
        setHasCropIntent(false);
        onCropFinish();
    };
    const handleCropCancel = ()=>{
        setHasCropIntent(false);
    };
    const handleCropStart = ()=>{
        setHasCropIntent(true);
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(CropperjsStyle, {}),
            /*#__PURE__*/ jsxs(RelativeBox, {
                hasRadius: true,
                background: "neutral150",
                borderColor: "neutral200",
                children: [
                    isCropperReady && isInCroppingMode && /*#__PURE__*/ jsx(CroppingActions, {
                        onValidate: handleCropping,
                        onDuplicate: asset.isLocal ? undefined : handleDuplication,
                        onCancel: handleCropCancel
                    }),
                    /*#__PURE__*/ jsx(ActionRow, {
                        paddingLeft: 3,
                        paddingRight: 3,
                        justifyContent: "flex-end",
                        children: /*#__PURE__*/ jsxs(Flex, {
                            gap: 1,
                            children: [
                                canUpdate && !asset.isLocal && /*#__PURE__*/ jsx(IconButton, {
                                    label: formatMessage({
                                        id: 'global.delete',
                                        defaultMessage: 'Delete'
                                    }),
                                    onClick: ()=>setShowConfirmDialog(true),
                                    children: /*#__PURE__*/ jsx(Trash, {})
                                }),
                                canDownload && /*#__PURE__*/ jsx(IconButton, {
                                    label: formatMessage({
                                        id: getTrad('control-card.download'),
                                        defaultMessage: 'Download'
                                    }),
                                    onClick: ()=>downloadFile(assetUrl, asset.name),
                                    children: /*#__PURE__*/ jsx(Download, {})
                                }),
                                canCopyLink && /*#__PURE__*/ jsx(CopyLinkButton, {
                                    url: assetUrl
                                }),
                                canUpdate && asset.mime?.includes(AssetType.Image) && /*#__PURE__*/ jsx(IconButton, {
                                    label: formatMessage({
                                        id: getTrad('control-card.crop'),
                                        defaultMessage: 'Crop'
                                    }),
                                    onClick: handleCropStart,
                                    children: /*#__PURE__*/ jsx(Crop, {})
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxs(Wrapper, {
                        children: [
                            isLoading && /*#__PURE__*/ jsx(UploadProgressWrapper, {
                                children: /*#__PURE__*/ jsx(UploadProgress, {
                                    error: error,
                                    onCancel: cancel,
                                    progress: progress
                                })
                            }),
                            isLoadingUpload && /*#__PURE__*/ jsx(UploadProgressWrapper, {
                                children: /*#__PURE__*/ jsx(UploadProgress, {
                                    error: uploadError,
                                    onCancel: cancelUpload,
                                    progress: progressUpload
                                })
                            }),
                            /*#__PURE__*/ jsx(AssetPreview, {
                                ref: previewRef,
                                mime: asset.mime,
                                name: asset.name,
                                url: hasCropIntent ? assetUrl : thumbnailUrl,
                                onLoad: ()=>{
                                    if (asset.isLocal || hasCropIntent) {
                                        setIsCropImageReady(true);
                                    }
                                }
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(ActionRow, {
                        paddingLeft: 2,
                        paddingRight: 2,
                        justifyContent: "flex-end",
                        $blurry: isInCroppingMode,
                        children: isInCroppingMode && width && height && /*#__PURE__*/ jsx(BadgeOverride, {
                            background: "neutral900",
                            color: "neutral0",
                            children: width && height ? `${height}✕${width}` : 'N/A'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(RemoveAssetDialog, {
                open: showConfirmDialog,
                onClose: ()=>{
                    setShowConfirmDialog(false);
                    onDelete(null);
                },
                asset: asset
            })
        ]
    });
};

export { PreviewBox };
//# sourceMappingURL=PreviewBox.mjs.map
