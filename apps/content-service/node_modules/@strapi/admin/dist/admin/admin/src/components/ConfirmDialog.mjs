import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Dialog, Button } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';

/**
 * @beta
 * @public
 * @description A simple confirm dialog that out of the box can be used to confirm an action.
 * The component can additionally be customised if required e.g. the footer actions can be
 * completely replaced, but cannot be removed. Passing a string as the children prop will render
 * the string as the body of the dialog. If you need more control over the body, you can pass a
 * custom component as the children prop.
 * @example
 * ```tsx
 * import { Dialog } from '@strapi/design-system';
 *
 * const DeleteAction = ({ id }) => {
 *  const [isOpen, setIsOpen] = React.useState(false);
 *
 *  const [delete] = useDeleteMutation()
 *  const handleConfirm = async () => {
 *    await delete(id)
 *    setIsOpen(false)
 *  }
 *
 *  return (
 *    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
 *      <Dialog.Trigger>
 *        <Button>Delete</Button>
 *      </Dialog.Trigger>
 *      <ConfirmDialog onConfirm={handleConfirm} />
 *    </Dialog.Root>
 *  )
 * }
 * ```
 */ const ConfirmDialog = ({ children, icon = /*#__PURE__*/ jsx(StyledWarning, {}), onConfirm, onCancel, variant = 'danger-light', startAction, endAction, title })=>{
    const { formatMessage } = useIntl();
    const [isConfirming, setIsConfirming] = React.useState(false);
    const content = children || formatMessage({
        id: 'app.confirm.body',
        defaultMessage: 'Are you sure?'
    });
    const handleConfirm = async (e)=>{
        if (!onConfirm) {
            return;
        }
        try {
            setIsConfirming(true);
            await onConfirm(e);
        } finally{
            setIsConfirming(false);
        }
    };
    return /*#__PURE__*/ jsxs(Dialog.Content, {
        children: [
            /*#__PURE__*/ jsx(Dialog.Header, {
                children: title || formatMessage({
                    id: 'app.components.ConfirmDialog.title',
                    defaultMessage: 'Confirmation'
                })
            }),
            /*#__PURE__*/ jsx(Dialog.Body, {
                icon: icon,
                children: content
            }),
            /*#__PURE__*/ jsxs(Dialog.Footer, {
                children: [
                    startAction || /*#__PURE__*/ jsx(Dialog.Cancel, {
                        children: /*#__PURE__*/ jsx(Button, {
                            fullWidth: true,
                            variant: "tertiary",
                            onClick: (e)=>{
                                e.stopPropagation();
                                if (onCancel) {
                                    onCancel(e);
                                }
                            },
                            children: formatMessage({
                                id: 'app.components.Button.cancel',
                                defaultMessage: 'Cancel'
                            })
                        })
                    }),
                    endAction || /*#__PURE__*/ jsx(Dialog.Action, {
                        children: /*#__PURE__*/ jsx(Button, {
                            fullWidth: true,
                            onClick: handleConfirm,
                            variant: variant,
                            loading: isConfirming,
                            children: formatMessage({
                                id: 'app.components.Button.confirm',
                                defaultMessage: 'Confirm'
                            })
                        })
                    })
                ]
            })
        ]
    });
};
const StyledWarning = styled(WarningCircle)`
  width: 24px;
  height: 24px;

  path {
    fill: ${({ theme })=>theme.colors.danger600};
  }
`;

export { ConfirmDialog };
//# sourceMappingURL=ConfirmDialog.mjs.map
