'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var EditAssetContent = require('../EditAssetDialog/EditAssetContent.js');
var AddAssetStep = require('./AddAssetStep/AddAssetStep.js');
var PendingAssetStep = require('./PendingAssetStep/PendingAssetStep.js');

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

const Steps = {
    AddAsset: 'AddAsset',
    PendingAsset: 'PendingAsset'
};
const UploadAssetDialog = ({ initialAssetsToAdd, folderId = null, onClose = ()=>{}, addUploadedFiles, trackedLocation, open, validateAssetsTypes = (_, cb)=>cb() })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [step, setStep] = React__namespace.useState(initialAssetsToAdd ? Steps.PendingAsset : Steps.AddAsset);
    const [assets, setAssets] = React__namespace.useState(initialAssetsToAdd || []);
    const [assetToEdit, setAssetToEdit] = React__namespace.useState(undefined);
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Root, {
        open: open,
        onOpenChange: handleClose,
        children: [
            step === Steps.AddAsset && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsx(AddAssetStep.AddAssetStep, {
                    onClose: onClose,
                    onAddAsset: (assets)=>handleAddToPendingAssets(assets),
                    trackedLocation: trackedLocation
                })
            }),
            step === Steps.PendingAsset && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsx(PendingAssetStep.PendingAssetStep, {
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
            assetToEdit && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsx(EditAssetContent.EditAssetContent, {
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

exports.UploadAssetDialog = UploadAssetDialog;
//# sourceMappingURL=UploadAssetDialog.js.map
