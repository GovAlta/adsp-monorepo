import { jsx } from 'react/jsx-runtime';
import { ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Dialog } from '@strapi/design-system';

const RemoveFolderDialog = ({ onClose, onConfirm, open })=>{
    return /*#__PURE__*/ jsx(Dialog.Root, {
        open: open,
        onOpenChange: onClose,
        children: /*#__PURE__*/ jsx(ConfirmDialog, {
            onConfirm: onConfirm
        })
    });
};

export { RemoveFolderDialog };
//# sourceMappingURL=RemoveFolderDialog.mjs.map
