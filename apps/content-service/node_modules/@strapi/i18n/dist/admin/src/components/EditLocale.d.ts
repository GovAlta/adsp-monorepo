import { Locale } from '../../../shared/contracts/locales';
interface EditLocaleProps extends Omit<EditModalProps, 'open' | 'onOpenChange'> {
}
declare const EditLocale: (props: EditLocaleProps) => import("react/jsx-runtime").JSX.Element;
interface EditModalProps extends Pick<Locale, 'id' | 'isDefault' | 'name' | 'code'> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
/**
 * @internal
 * @description Exported to be used when someone clicks on a table row.
 */
declare const EditModal: ({ id, code, isDefault, name, open, onOpenChange }: EditModalProps) => import("react/jsx-runtime").JSX.Element;
export { EditLocale, EditModal };
