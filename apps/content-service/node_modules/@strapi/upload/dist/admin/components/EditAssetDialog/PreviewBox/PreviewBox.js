'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var cropperjscss = require('cropperjs/dist/cropper.css?raw');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var constants = require('../../../constants.js');
var useCropImg = require('../../../hooks/useCropImg.js');
var useEditAsset = require('../../../hooks/useEditAsset.js');
var useUpload = require('../../../hooks/useUpload.js');
var createAssetUrl = require('../../../utils/createAssetUrl.js');
var downloadFile = require('../../../utils/downloadFile.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../utils/urlYupSchema.js');
var CopyLinkButton = require('../../CopyLinkButton/CopyLinkButton.js');
var UploadProgress = require('../../UploadProgress/UploadProgress.js');
var RemoveAssetDialog = require('../RemoveAssetDialog.js');
var AssetPreview = require('./AssetPreview.js');
var CroppingActions = require('./CroppingActions.js');
var PreviewComponents = require('./PreviewComponents.js');

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

// TODO: find a better naming convention for the file that was an index file before
const PreviewBox = ({ asset, canUpdate, canCopyLink, canDownload, onDelete, onCropFinish, onCropStart, onCropCancel, replacementFile, trackedLocation })=>{
    const CropperjsStyle = styledComponents.createGlobalStyle`${cropperjscss}`;
    const { trackUsage } = strapiAdmin.useTracking();
    const previewRef = React__namespace.useRef(null);
    const [isCropImageReady, setIsCropImageReady] = React__namespace.useState(false);
    const [hasCropIntent, setHasCropIntent] = React__namespace.useState(null);
    const [assetUrl, setAssetUrl] = React__namespace.useState(createAssetUrl.createAssetUrl(asset, false));
    const [thumbnailUrl, setThumbnailUrl] = React__namespace.useState(createAssetUrl.createAssetUrl(asset, true));
    const { formatMessage } = reactIntl.useIntl();
    const [showConfirmDialog, setShowConfirmDialog] = React__namespace.useState(false);
    const { crop, produceFile, stopCropping, isCropping, isCropperReady, width, height } = useCropImg.useCropImg();
    const { editAsset, error, isLoading, progress, cancel } = useEditAsset.useEditAsset();
    const { upload, isLoading: isLoadingUpload, cancel: cancelUpload, error: uploadError, progress: progressUpload } = useUpload.useUpload();
    React__namespace.useEffect(()=>{
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
    React__namespace.useEffect(()=>{
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
    React__namespace.useEffect(()=>{
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
            optimizedCachingImage = createAssetUrl.createAssetUrl(updatedAsset, false);
            optimizedCachingThumbnailImage = createAssetUrl.createAssetUrl(updatedAsset, true);
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
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(CropperjsStyle, {}),
            /*#__PURE__*/ jsxRuntime.jsxs(PreviewComponents.RelativeBox, {
                hasRadius: true,
                background: "neutral150",
                borderColor: "neutral200",
                children: [
                    isCropperReady && isInCroppingMode && /*#__PURE__*/ jsxRuntime.jsx(CroppingActions.CroppingActions, {
                        onValidate: handleCropping,
                        onDuplicate: asset.isLocal ? undefined : handleDuplication,
                        onCancel: handleCropCancel
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(PreviewComponents.ActionRow, {
                        paddingLeft: 3,
                        paddingRight: 3,
                        justifyContent: "flex-end",
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            gap: 1,
                            children: [
                                canUpdate && !asset.isLocal && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    label: formatMessage({
                                        id: 'global.delete',
                                        defaultMessage: 'Delete'
                                    }),
                                    onClick: ()=>setShowConfirmDialog(true),
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
                                }),
                                canDownload && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    label: formatMessage({
                                        id: getTrad.getTrad('control-card.download'),
                                        defaultMessage: 'Download'
                                    }),
                                    onClick: ()=>downloadFile.downloadFile(assetUrl, asset.name),
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Download, {})
                                }),
                                canCopyLink && /*#__PURE__*/ jsxRuntime.jsx(CopyLinkButton.CopyLinkButton, {
                                    url: assetUrl
                                }),
                                canUpdate && asset.mime?.includes(constants.AssetType.Image) && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    label: formatMessage({
                                        id: getTrad.getTrad('control-card.crop'),
                                        defaultMessage: 'Crop'
                                    }),
                                    onClick: handleCropStart,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Crop, {})
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(PreviewComponents.Wrapper, {
                        children: [
                            isLoading && /*#__PURE__*/ jsxRuntime.jsx(PreviewComponents.UploadProgressWrapper, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(UploadProgress.UploadProgress, {
                                    error: error,
                                    onCancel: cancel,
                                    progress: progress
                                })
                            }),
                            isLoadingUpload && /*#__PURE__*/ jsxRuntime.jsx(PreviewComponents.UploadProgressWrapper, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(UploadProgress.UploadProgress, {
                                    error: uploadError,
                                    onCancel: cancelUpload,
                                    progress: progressUpload
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(AssetPreview.AssetPreview, {
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
                    /*#__PURE__*/ jsxRuntime.jsx(PreviewComponents.ActionRow, {
                        paddingLeft: 2,
                        paddingRight: 2,
                        justifyContent: "flex-end",
                        $blurry: isInCroppingMode,
                        children: isInCroppingMode && width && height && /*#__PURE__*/ jsxRuntime.jsx(PreviewComponents.BadgeOverride, {
                            background: "neutral900",
                            color: "neutral0",
                            children: width && height ? `${height}✕${width}` : 'N/A'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(RemoveAssetDialog.RemoveAssetDialog, {
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

exports.PreviewBox = PreviewBox;
//# sourceMappingURL=PreviewBox.js.map
