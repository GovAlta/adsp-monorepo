import { jsx } from 'react/jsx-runtime';
import { ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Dialog } from '@strapi/design-system';
import { useRemoveAsset } from '../../hooks/useRemoveAsset.mjs';

const RemoveAssetDialog = ({ open, onClose, asset })=>{
    // `null` means asset is deleted
    const { removeAsset } = useRemoveAsset(()=>{
        onClose(null);
    });
    const handleConfirm = async (event)=>{
        event?.preventDefault();
        await removeAsset(asset.id);
    };
    return /*#__PURE__*/ jsx(Dialog.Root, {
        open: open,
        onOpenChange: onClose,
        children: /*#__PURE__*/ jsx(ConfirmDialog, {
            onConfirm: handleConfirm
        })
    });
};

export { RemoveAssetDialog };
//# sourceMappingURL=RemoveAssetDialog.mjs.map
