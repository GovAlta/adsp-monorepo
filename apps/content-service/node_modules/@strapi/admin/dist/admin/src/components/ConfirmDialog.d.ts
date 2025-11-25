import * as React from 'react';
import { ButtonProps, Dialog } from '@strapi/design-system';
interface ConfirmDialogProps extends Pick<ButtonProps, 'variant'>, Pick<Dialog.BodyProps, 'icon'> {
    onConfirm?: (e?: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
    onCancel?: (e?: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
    children?: React.ReactNode;
    endAction?: React.ReactNode;
    startAction?: React.ReactNode;
    title?: React.ReactNode;
}
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
 */
declare const ConfirmDialog: ({ children, icon, onConfirm, onCancel, variant, startAction, endAction, title, }: ConfirmDialogProps) => import("react/jsx-runtime").JSX.Element;
export { ConfirmDialog };
export type { ConfirmDialogProps };
