'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getAllowedFiles = require('../../utils/getAllowedFiles.js');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');
var AssetDialog = require('../AssetDialog/AssetDialog.js');
var EditFolderDialog = require('../EditFolderDialog/EditFolderDialog.js');
var UploadAssetDialog = require('../UploadAssetDialog/UploadAssetDialog.js');
var CarouselAssets = require('./Carousel/CarouselAssets.js');

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
const MediaLibraryInput = /*#__PURE__*/ React__namespace.forwardRef(({ attribute: { allowedTypes = null, multiple = false } = {}, label, hint, disabled = false, labelAction = undefined, name, required = false }, forwardedRef)=>{
    const { formatMessage } = reactIntl.useIntl();
    const { onChange, value, error } = strapiAdmin.useField(name);
    const [uploadedFiles, setUploadedFiles] = React__namespace.useState([]);
    const [step, setStep] = React__namespace.useState(undefined);
    const [selectedIndex, setSelectedIndex] = React__namespace.useState(0);
    const [droppedAssets, setDroppedAssets] = React__namespace.useState();
    const [folderId, setFolderId] = React__namespace.useState(null);
    const { toggleNotification } = strapiAdmin.useNotification();
    React__namespace.useEffect(()=>{
        // Clear the uploaded files on close
        if (step === undefined) {
            setUploadedFiles([]);
        }
    }, [
        step
    ]);
    let selectedAssets = [];
    if (Array.isArray(value)) {
        selectedAssets = value;
    } else if (value) {
        selectedAssets = [
            value
        ];
    }
    const handleValidation = (nextSelectedAssets)=>{
        const value = multiple ? nextSelectedAssets : nextSelectedAssets[0];
        onChange(name, value);
        setStep(undefined);
    };
    const handleDeleteAssetFromMediaLibrary = ()=>{
        let nextValue;
        if (multiple) {
            const nextSelectedAssets = selectedAssets.filter((_, assetIndex)=>assetIndex !== selectedIndex);
            nextValue = nextSelectedAssets.length > 0 ? nextSelectedAssets : null;
        } else {
            nextValue = null;
        }
        const value = nextValue;
        onChange(name, value);
        setSelectedIndex(0);
    };
    const handleDeleteAsset = (asset)=>{
        let nextValue;
        if (multiple) {
            const nextSelectedAssets = selectedAssets.filter((prevAsset)=>prevAsset.id !== asset.id);
            nextValue = nextSelectedAssets.length > 0 ? nextSelectedAssets : null;
        } else {
            nextValue = null;
        }
        onChange(name, nextValue);
        setSelectedIndex(0);
    };
    const handleAssetEdit = (asset)=>{
        const nextSelectedAssets = selectedAssets.map((prevAsset)=>prevAsset.id === asset.id ? asset : prevAsset);
        onChange(name, multiple ? nextSelectedAssets : nextSelectedAssets[0]);
    };
    const validateAssetsTypes = (assets, callback)=>{
        const allowedAssets = getAllowedFiles.getAllowedFiles(allowedTypes, assets);
        if (allowedAssets.length > 0) {
            callback(allowedAssets);
        } else {
            toggleNotification({
                type: 'danger',
                timeout: 4000,
                message: formatMessage({
                    id: getTrad.getTrad('input.notification.not-supported'),
                    defaultMessage: `You can't upload this type of file.`
                }, {
                    fileTypes: (allowedTypes ?? []).join(',')
                })
            });
        }
    };
    const handleAssetDrop = (assets)=>{
        validateAssetsTypes(assets, (allowedAssets)=>{
            setDroppedAssets(allowedAssets);
            setStep(STEPS.AssetUpload);
        });
    };
    if (multiple && selectedAssets.length > 0) {
        label = `${label} (${selectedIndex + 1} / ${selectedAssets.length})`;
    }
    const handleNext = ()=>{
        setSelectedIndex((current)=>current < selectedAssets.length - 1 ? current + 1 : 0);
    };
    const handlePrevious = ()=>{
        setSelectedIndex((current)=>current > 0 ? current - 1 : selectedAssets.length - 1);
    };
    const handleFilesUploadSucceeded = (uploadedFiles)=>{
        setUploadedFiles((prev)=>[
                ...prev,
                ...uploadedFiles
            ]);
    };
    let initiallySelectedAssets = selectedAssets;
    if (uploadedFiles.length > 0) {
        const allowedUploadedFiles = getAllowedFiles.getAllowedFiles(allowedTypes, uploadedFiles);
        initiallySelectedAssets = multiple ? [
            ...allowedUploadedFiles,
            ...selectedAssets
        ] : [
            allowedUploadedFiles[0]
        ];
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(CarouselAssets.CarouselAssets, {
                ref: forwardedRef,
                assets: selectedAssets,
                disabled: disabled,
                label: label,
                labelAction: labelAction,
                onDeleteAsset: handleDeleteAsset,
                onDeleteAssetFromMediaLibrary: handleDeleteAssetFromMediaLibrary,
                onAddAsset: ()=>setStep(STEPS.AssetSelect),
                onDropAsset: handleAssetDrop,
                onEditAsset: handleAssetEdit,
                onNext: handleNext,
                onPrevious: handlePrevious,
                error: error,
                hint: hint,
                required: required,
                selectedAssetIndex: selectedIndex,
                trackedLocation: "content-manager"
            }),
            step === STEPS.AssetSelect && /*#__PURE__*/ jsxRuntime.jsx(AssetDialog.AssetDialog, {
                allowedTypes: allowedTypes,
                initiallySelectedAssets: initiallySelectedAssets,
                folderId: folderId,
                onClose: ()=>{
                    setStep(undefined);
                    setFolderId(null);
                },
                open: step === STEPS.AssetSelect,
                onValidate: handleValidation,
                multiple: multiple,
                onAddAsset: ()=>setStep(STEPS.AssetUpload),
                onAddFolder: ()=>setStep(STEPS.FolderCreate),
                onChangeFolder: (folder)=>setFolderId(folder),
                trackedLocation: "content-manager"
            }),
            step === STEPS.AssetUpload && /*#__PURE__*/ jsxRuntime.jsx(UploadAssetDialog.UploadAssetDialog, {
                open: step === STEPS.AssetUpload,
                onClose: ()=>setStep(STEPS.AssetSelect),
                initialAssetsToAdd: droppedAssets,
                addUploadedFiles: handleFilesUploadSucceeded,
                trackedLocation: "content-manager",
                folderId: folderId,
                validateAssetsTypes: validateAssetsTypes
            }),
            step === STEPS.FolderCreate && /*#__PURE__*/ jsxRuntime.jsx(EditFolderDialog.EditFolderDialog, {
                open: step === STEPS.FolderCreate,
                onClose: ()=>setStep(STEPS.AssetSelect),
                parentFolderId: folderId
            })
        ]
    });
});

exports.MediaLibraryInput = MediaLibraryInput;
//# sourceMappingURL=MediaLibraryInput.js.map
