import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Modal, Button } from '@strapi/design-system';
import { Folder } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { BulkMoveDialog } from '../../../../components/BulkMoveDialog/BulkMoveDialog.mjs';

const BulkMoveButton = ({ selected = [], onSuccess, currentFolder })=>{
    const { formatMessage } = useIntl();
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
    const handleConfirmMove = ()=>{
        setShowConfirmDialog(false);
        onSuccess();
    };
    return /*#__PURE__*/ jsxs(Modal.Root, {
        open: showConfirmDialog,
        onOpenChange: setShowConfirmDialog,
        children: [
            /*#__PURE__*/ jsx(Modal.Trigger, {
                children: /*#__PURE__*/ jsx(Button, {
                    variant: "secondary",
                    size: "S",
                    startIcon: /*#__PURE__*/ jsx(Folder, {}),
                    children: formatMessage({
                        id: 'global.move',
                        defaultMessage: 'Move'
                    })
                })
            }),
            /*#__PURE__*/ jsx(BulkMoveDialog, {
                currentFolder: currentFolder,
                onClose: handleConfirmMove,
                selected: selected
            })
        ]
    });
};

export { BulkMoveButton };
//# sourceMappingURL=BulkMoveButton.mjs.map
