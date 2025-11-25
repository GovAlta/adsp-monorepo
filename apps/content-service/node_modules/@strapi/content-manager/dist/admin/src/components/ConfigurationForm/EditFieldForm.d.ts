import type { Schema } from '@strapi/types';
interface EditFieldFormProps {
    attribute?: Schema.Attribute.AnyAttribute;
    name: string;
    onClose: () => void;
}
declare const EditFieldForm: ({ attribute, name, onClose }: EditFieldFormProps) => import("react/jsx-runtime").JSX.Element | null;
export { EditFieldForm };
export type { EditFieldFormProps };
