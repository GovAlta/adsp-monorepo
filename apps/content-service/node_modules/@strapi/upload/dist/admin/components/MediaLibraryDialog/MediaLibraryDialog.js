'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var AssetDialog = require('../AssetDialog/AssetDialog.js');
var EditFolderDialog = require('../EditFolderDialog/EditFolderDialog.js');
var UploadAssetDialog = require('../UploadAssetDialog/UploadAssetDialog.js');

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
const STEPS = {
    AssetSelect: 'SelectAsset',
    AssetUpload: 'UploadAsset',
    FolderCreate: 'FolderCreate'
};
const MediaLibraryDialog = ({ onClose, onSelectAssets, allowedTypes = [
    'files',
    'images',
    'videos',
    'audios'
] })=>{
    const [step, setStep] = React__namespace.useState(STEPS.AssetSelect);
    const [folderId, setFolderId] = React__namespace.useState(null);
    switch(step){
        case STEPS.AssetSelect:
            return /*#__PURE__*/ jsxRuntime.jsx(AssetDialog.AssetDialog, {
                allowedTypes: allowedTypes,
                folderId: folderId,
                open: true,
                onClose: onClose,
                onValidate: onSelectAssets,
                onAddAsset: ()=>setStep(STEPS.AssetUpload),
                onAddFolder: ()=>setStep(STEPS.FolderCreate),
                onChangeFolder: (folderId)=>setFolderId(folderId),
                multiple: true
            });
        case STEPS.FolderCreate:
            return /*#__PURE__*/ jsxRuntime.jsx(EditFolderDialog.EditFolderDialog, {
                open: true,
                onClose: ()=>setStep(STEPS.AssetSelect),
                parentFolderId: folderId
            });
        default:
            return /*#__PURE__*/ jsxRuntime.jsx(UploadAssetDialog.UploadAssetDialog, {
                open: true,
                onClose: ()=>setStep(STEPS.AssetSelect),
                folderId: folderId
            });
    }
};

exports.MediaLibraryDialog = MediaLibraryDialog;
//# sourceMappingURL=MediaLibraryDialog.js.map
