import type { InputProps } from '@strapi/admin/strapi-admin';
import type { Schema } from '@strapi/types';
interface NotAllowedInputProps extends Omit<InputProps, 'type'> {
    type: Schema.Attribute.Kind;
}
declare const NotAllowedInput: ({ hint, label, required, name }: NotAllowedInputProps) => import("react/jsx-runtime").JSX.Element;
export { NotAllowedInput };
