import { jsxs, jsx } from 'react/jsx-runtime';
import { ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Dialog, Button } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useBulkRemove } from '../../../../hooks/useBulkRemove.mjs';

const BulkDeleteButton = ({ selected, onSuccess })=>{
    const { formatMessage } = useIntl();
    const { remove } = useBulkRemove();
    const handleConfirmRemove = async ()=>{
        await remove(selected);
        onSuccess();
    };
    return /*#__PURE__*/ jsxs(Dialog.Root, {
        children: [
            /*#__PURE__*/ jsx(Dialog.Trigger, {
                children: /*#__PURE__*/ jsx(Button, {
                    variant: "danger-light",
                    size: "S",
                    startIcon: /*#__PURE__*/ jsx(Trash, {}),
                    children: formatMessage({
                        id: 'global.delete',
                        defaultMessage: 'Delete'
                    })
                })
            }),
            /*#__PURE__*/ jsx(ConfirmDialog, {
                onConfirm: handleConfirmRemove
            })
        ]
    });
};

export { BulkDeleteButton };
//# sourceMappingURL=BulkDeleteButton.mjs.map
