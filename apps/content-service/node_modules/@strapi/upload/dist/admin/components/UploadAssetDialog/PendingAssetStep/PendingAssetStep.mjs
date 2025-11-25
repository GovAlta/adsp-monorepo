import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking } from '@strapi/admin/strapi-admin';
import { Modal, Flex, Typography, Button, KeyboardNavigable, Grid } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';
import { AssetCard } from '../../AssetCard/AssetCard.mjs';
import { UploadingAssetCard } from '../../AssetCard/UploadingAssetCard.mjs';

const Status = {
    Idle: 'IDLE',
    Uploading: 'UPLOADING',
    Intermediate: 'INTERMEDIATE'
};
const PendingAssetStep = ({ addUploadedFiles, folderId, onClose, onEditAsset, onRemoveAsset, assets, onClickAddAsset, onCancelUpload, onUploadSucceed, trackedLocation })=>{
    const assetCountRef = React.useRef(0);
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const [uploadStatus, setUploadStatus] = React.useState(Status.Idle);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        e.stopPropagation();
        const assetsCountByType = assets.reduce((acc, asset)=>{
            const { type } = asset;
            if (type !== undefined && !acc[type]) {
                acc[type] = 0;
            }
            if (type !== undefined) {
                const accType = acc[type];
                const currentCount = typeof accType === 'string' ? accType : accType.toString();
                acc[type] = `${parseInt(currentCount, 10) + 1}`;
            }
            return acc;
        }, {});
        trackUsage('willAddMediaLibraryAssets', {
            location: trackedLocation,
            ...assetsCountByType
        });
        setUploadStatus(Status.Uploading);
    };
    const handleStatusChange = (status, file)=>{
        if (status === 'success' || status === 'error') {
            assetCountRef.current++;
            // There's no "terminated" status. When all the files have called their
            // onUploadSucceed callback, the parent component filters the asset list
            // and closes the modal when the asset list is empty
            if (assetCountRef.current === assets.length) {
                assetCountRef.current = 0;
                setUploadStatus(Status.Intermediate);
            }
        }
        if (status === 'success') {
            onUploadSucceed(file);
        }
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Modal.Header, {
                children: /*#__PURE__*/ jsx(Modal.Title, {
                    children: formatMessage({
                        id: getTrad('header.actions.add-assets'),
                        defaultMessage: 'Add new assets'
                    })
                })
            }),
            /*#__PURE__*/ jsx(Modal.Body, {
                children: /*#__PURE__*/ jsxs(Flex, {
                    direction: "column",
                    alignItems: "stretch",
                    gap: 7,
                    children: [
                        /*#__PURE__*/ jsxs(Flex, {
                            justifyContent: "space-between",
                            children: [
                                /*#__PURE__*/ jsxs(Flex, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 0,
                                    children: [
                                        /*#__PURE__*/ jsx(Typography, {
                                            variant: "pi",
                                            fontWeight: "bold",
                                            textColor: "neutral800",
                                            children: formatMessage({
                                                id: getTrad('list.assets.to-upload'),
                                                defaultMessage: '{number, plural, =0 {No asset} one {1 asset} other {# assets}} ready to upload'
                                            }, {
                                                number: assets.length
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Typography, {
                                            variant: "pi",
                                            textColor: "neutral600",
                                            children: formatMessage({
                                                id: getTrad('modal.upload-list.sub-header-subtitle'),
                                                defaultMessage: 'Manage the assets before adding them to the Media Library'
                                            })
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsx(Button, {
                                    size: "S",
                                    onClick: onClickAddAsset,
                                    children: formatMessage({
                                        id: getTrad('header.actions.add-assets'),
                                        defaultMessage: 'Add new assets'
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx(KeyboardNavigable, {
                            tagName: "article",
                            children: /*#__PURE__*/ jsx(Grid.Root, {
                                gap: 4,
                                children: assets.map((asset)=>{
                                    const assetKey = asset.url;
                                    if (uploadStatus === Status.Uploading || uploadStatus === Status.Intermediate) {
                                        return /*#__PURE__*/ jsx(Grid.Item, {
                                            col: 4,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsx(UploadingAssetCard, {
                                                // Props used to store the newly uploaded files
                                                addUploadedFiles: addUploadedFiles,
                                                asset: asset,
                                                id: assetKey,
                                                onCancel: onCancelUpload,
                                                onStatusChange: (status)=>handleStatusChange(status, asset.rawFile),
                                                size: "S",
                                                folderId: folderId
                                            })
                                        }, assetKey);
                                    }
                                    return /*#__PURE__*/ jsx(Grid.Item, {
                                        col: 4,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsx(AssetCard, {
                                            asset: asset,
                                            size: "S",
                                            local: true,
                                            alt: asset.name,
                                            onEdit: onEditAsset,
                                            onRemove: onRemoveAsset
                                        }, assetKey)
                                    }, assetKey);
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Modal.Footer, {
                children: [
                    /*#__PURE__*/ jsx(Button, {
                        onClick: onClose,
                        variant: "tertiary",
                        children: formatMessage({
                            id: 'app.components.Button.cancel',
                            defaultMessage: 'cancel'
                        })
                    }),
                    /*#__PURE__*/ jsx(Button, {
                        onClick: handleSubmit,
                        loading: uploadStatus === Status.Uploading,
                        children: formatMessage({
                            id: getTrad('modal.upload-list.footer.button'),
                            defaultMessage: 'Upload {number, plural, one {# asset} other {# assets}} to the library'
                        }, {
                            number: assets.length
                        })
                    })
                ]
            })
        ]
    });
};

export { PendingAssetStep };
//# sourceMappingURL=PendingAssetStep.mjs.map
