import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useField, useNotification } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getAllowedFiles } from '../../utils/getAllowedFiles.mjs';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';
import { AssetDialog } from '../AssetDialog/AssetDialog.mjs';
import { EditFolderDialog } from '../EditFolderDialog/EditFolderDialog.mjs';
import { UploadAssetDialog } from '../UploadAssetDialog/UploadAssetDialog.mjs';
import { CarouselAssets } from './Carousel/CarouselAssets.mjs';

// TODO: find a better naming convention for the file that was an index file before
const STEPS = {
    AssetSelect: 'SelectAsset',
    AssetUpload: 'UploadAsset',
    FolderCreate: 'FolderCreate'
};
const MediaLibraryInput = /*#__PURE__*/ React.forwardRef(({ attribute: { allowedTypes = null, multiple = false } = {}, label, hint, disabled = false, labelAction = undefined, name, required = false }, forwardedRef)=>{
    const { formatMessage } = useIntl();
    const { onChange, value, error } = useField(name);
    const [uploadedFiles, setUploadedFiles] = React.useState([]);
    const [step, setStep] = React.useState(undefined);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [droppedAssets, setDroppedAssets] = React.useState();
    const [folderId, setFolderId] = React.useState(null);
    const { toggleNotification } = useNotification();
    React.useEffect(()=>{
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
        const allowedAssets = getAllowedFiles(allowedTypes, assets);
        if (allowedAssets.length > 0) {
            callback(allowedAssets);
        } else {
            toggleNotification({
                type: 'danger',
                timeout: 4000,
                message: formatMessage({
                    id: getTrad('input.notification.not-supported'),
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
        const allowedUploadedFiles = getAllowedFiles(allowedTypes, uploadedFiles);
        initiallySelectedAssets = multiple ? [
            ...allowedUploadedFiles,
            ...selectedAssets
        ] : [
            allowedUploadedFiles[0]
        ];
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(CarouselAssets, {
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
            step === STEPS.AssetSelect && /*#__PURE__*/ jsx(AssetDialog, {
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
            step === STEPS.AssetUpload && /*#__PURE__*/ jsx(UploadAssetDialog, {
                open: step === STEPS.AssetUpload,
                onClose: ()=>setStep(STEPS.AssetSelect),
                initialAssetsToAdd: droppedAssets,
                addUploadedFiles: handleFilesUploadSucceeded,
                trackedLocation: "content-manager",
                folderId: folderId,
                validateAssetsTypes: validateAssetsTypes
            }),
            step === STEPS.FolderCreate && /*#__PURE__*/ jsx(EditFolderDialog, {
                open: step === STEPS.FolderCreate,
                onClose: ()=>setStep(STEPS.AssetSelect),
                parentFolderId: folderId
            })
        ]
    });
});

export { MediaLibraryInput };
//# sourceMappingURL=MediaLibraryInput.mjs.map
