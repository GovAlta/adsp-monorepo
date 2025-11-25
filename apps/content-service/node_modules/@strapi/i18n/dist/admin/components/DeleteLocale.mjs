import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotification, useAPIErrorHandler, ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Dialog, IconButton } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useDeleteLocaleMutation } from '../services/locales.mjs';
import { getTranslation } from '../utils/getTranslation.mjs';

const DeleteLocale = ({ id, name })=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const [visible, setVisible] = React.useState(false);
    const [deleteLocale] = useDeleteLocaleMutation();
    const handleConfirm = async ()=>{
        try {
            const res = await deleteLocale(id);
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
                return;
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTranslation('Settings.locales.modal.delete.success'),
                    defaultMessage: 'Deleted locale'
                })
            });
            setVisible(false);
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred, please try again'
                })
            });
        }
    };
    return /*#__PURE__*/ jsxs(Dialog.Root, {
        open: visible,
        onOpenChange: setVisible,
        children: [
            /*#__PURE__*/ jsx(Dialog.Trigger, {
                children: /*#__PURE__*/ jsx(IconButton, {
                    onClick: ()=>setVisible(true),
                    label: formatMessage({
                        id: getTranslation('Settings.list.actions.delete'),
                        defaultMessage: 'Delete {name} locale'
                    }, {
                        name
                    }),
                    variant: "ghost",
                    children: /*#__PURE__*/ jsx(Trash, {})
                })
            }),
            /*#__PURE__*/ jsx(ConfirmDialog, {
                onConfirm: handleConfirm
            })
        ]
    });
};

export { DeleteLocale };
//# sourceMappingURL=DeleteLocale.mjs.map
