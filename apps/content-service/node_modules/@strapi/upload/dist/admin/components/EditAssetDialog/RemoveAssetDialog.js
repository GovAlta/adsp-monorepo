'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var useRemoveAsset = require('../../hooks/useRemoveAsset.js');

const RemoveAssetDialog = ({ open, onClose, asset })=>{
    // `null` means asset is deleted
    const { removeAsset } = useRemoveAsset.useRemoveAsset(()=>{
        onClose(null);
    });
    const handleConfirm = async (event)=>{
        event?.preventDefault();
        await removeAsset(asset.id);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
        open: open,
        onOpenChange: onClose,
        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
            onConfirm: handleConfirm
        })
    });
};

exports.RemoveAssetDialog = RemoveAssetDialog;
//# sourceMappingURL=RemoveAssetDialog.js.map
