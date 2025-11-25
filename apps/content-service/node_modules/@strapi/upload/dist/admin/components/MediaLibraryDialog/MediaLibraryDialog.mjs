import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { AssetDialog } from '../AssetDialog/AssetDialog.mjs';
import { EditFolderDialog } from '../EditFolderDialog/EditFolderDialog.mjs';
import { UploadAssetDialog } from '../UploadAssetDialog/UploadAssetDialog.mjs';

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
    const [step, setStep] = React.useState(STEPS.AssetSelect);
    const [folderId, setFolderId] = React.useState(null);
    switch(step){
        case STEPS.AssetSelect:
            return /*#__PURE__*/ jsx(AssetDialog, {
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
            return /*#__PURE__*/ jsx(EditFolderDialog, {
                open: true,
                onClose: ()=>setStep(STEPS.AssetSelect),
                parentFolderId: folderId
            });
        default:
            return /*#__PURE__*/ jsx(UploadAssetDialog, {
                open: true,
                onClose: ()=>setStep(STEPS.AssetSelect),
                folderId: folderId
            });
    }
};

export { MediaLibraryDialog };
//# sourceMappingURL=MediaLibraryDialog.mjs.map
