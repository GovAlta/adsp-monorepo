'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var useBulkRemove = require('../../../../hooks/useBulkRemove.js');

const BulkDeleteButton = ({ selected, onSuccess })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { remove } = useBulkRemove.useBulkRemove();
    const handleConfirmRemove = async ()=>{
        await remove(selected);
        onSuccess();
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "danger-light",
                    size: "S",
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {}),
                    children: formatMessage({
                        id: 'global.delete',
                        defaultMessage: 'Delete'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                onConfirm: handleConfirmRemove
            })
        ]
    });
};

exports.BulkDeleteButton = BulkDeleteButton;
//# sourceMappingURL=BulkDeleteButton.js.map
