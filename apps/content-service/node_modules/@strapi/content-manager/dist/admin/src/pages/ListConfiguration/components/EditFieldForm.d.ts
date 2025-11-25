import type { ListFieldLayout } from '../../../hooks/useDocumentLayout';
interface EditFieldFormProps extends Pick<ListFieldLayout, 'attribute'> {
    name: string;
    onClose: () => void;
}
declare const EditFieldForm: ({ attribute, name, onClose }: EditFieldFormProps) => import("react/jsx-runtime").JSX.Element | null;
export { EditFieldForm };
export type { EditFieldFormProps };
