'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');

const RemoveFolderDialog = ({ onClose, onConfirm, open })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
        open: open,
        onOpenChange: onClose,
        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
            onConfirm: onConfirm
        })
    });
};

exports.RemoveFolderDialog = RemoveFolderDialog;
//# sourceMappingURL=RemoveFolderDialog.js.map
