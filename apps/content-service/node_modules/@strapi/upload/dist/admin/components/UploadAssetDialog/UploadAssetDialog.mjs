import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Modal } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { EditAssetContent } from '../EditAssetDialog/EditAssetContent.mjs';
import { AddAssetStep } from './AddAssetStep/AddAssetStep.mjs';
import { PendingAssetStep } from './PendingAssetStep/PendingAssetStep.mjs';

const Steps = {
    AddAsset: 'AddAsset',
    PendingAsset: 'PendingAsset'
};
const UploadAssetDialog = ({ initialAssetsToAdd, folderId = null, onClose = ()=>{}, addUploadedFiles, trackedLocation, open, validateAssetsTypes = (_, cb)=>cb() })=>{
    const { formatMessage } = useIntl();
    const [step, setStep] = React.useState(initialAssetsToAdd ? Steps.PendingAsset : Steps.AddAsset);
    const [assets, setAssets] = React.useState(initialAssetsToAdd || []);
    const [assetToEdit, setAssetToEdit] = React.useState(undefined);
    const handleAddToPendingAssets = (nextAssets)=>{
        validateAssetsTypes(nextAssets, ()=>{
            setAssets((prevAssets)=>prevAssets.concat(nextAssets));
            setStep(Steps.PendingAsset);
        });
    };
    const moveToAddAsset = ()=>{
        setStep(Steps.AddAsset);
    };
    const handleCancelUpload = (file)=>{
        const nextAssets = assets.filter((asset)=>asset.rawFile !== file);
        setAssets(nextAssets);
        // When there's no asset, transition to the AddAsset step
        if (nextAssets.length === 0) {
            moveToAddAsset();
        }
    };
    const handleUploadSuccess = (file)=>{
        const nextAssets = assets.filter((asset)=>asset.rawFile !== file);
        setAssets(nextAssets);
        if (nextAssets.length === 0) {
            onClose();
        }
    };
    const handleAssetEditValidation = (nextAsset)=>{
        if (nextAsset && typeof nextAsset !== 'boolean') {
            const nextAssets = assets.map((asset)=>asset === assetToEdit ? nextAsset : asset);
            setAssets(nextAssets);
        }
        setAssetToEdit(undefined);
    };
    const handleClose = ()=>{
        if (step === Steps.PendingAsset && assets.length > 0) {
            // eslint-disable-next-line no-alert
            const confirm = window.confirm(formatMessage({
                id: 'window.confirm.close-modal.files',
                defaultMessage: 'Are you sure? You have some files that have not been uploaded yet.'
            }));
            if (confirm) {
                onClose();
            }
        } else {
            onClose();
        }
    };
    const handleRemoveAsset = (assetToRemove)=>{
        const nextAssets = assets.filter((asset)=>asset !== assetToRemove);
        setAssets(nextAssets);
    };
    return /*#__PURE__*/ jsxs(Modal.Root, {
        open: open,
        onOpenChange: handleClose,
        children: [
            step === Steps.AddAsset && /*#__PURE__*/ jsx(Modal.Content, {
                children: /*#__PURE__*/ jsx(AddAssetStep, {
                    onClose: onClose,
                    onAddAsset: (assets)=>handleAddToPendingAssets(assets),
                    trackedLocation: trackedLocation
                })
            }),
            step === Steps.PendingAsset && /*#__PURE__*/ jsx(Modal.Content, {
                children: /*#__PURE__*/ jsx(PendingAssetStep, {
                    onClose: handleClose,
                    assets: assets,
                    onEditAsset: setAssetToEdit,
                    onRemoveAsset: handleRemoveAsset,
                    onClickAddAsset: moveToAddAsset,
                    onCancelUpload: handleCancelUpload,
                    onUploadSucceed: handleUploadSuccess,
                    initialAssetsToAdd: initialAssetsToAdd,
                    addUploadedFiles: addUploadedFiles,
                    folderId: folderId,
                    trackedLocation: trackedLocation
                })
            }),
            assetToEdit && /*#__PURE__*/ jsx(Modal.Content, {
                children: /*#__PURE__*/ jsx(EditAssetContent, {
                    onClose: handleAssetEditValidation,
                    asset: assetToEdit,
                    canUpdate: true,
                    canCopyLink: false,
                    canDownload: false,
                    trackedLocation: trackedLocation
                })
            })
        ]
    });
};

export { UploadAssetDialog };
//# sourceMappingURL=UploadAssetDialog.mjs.map
