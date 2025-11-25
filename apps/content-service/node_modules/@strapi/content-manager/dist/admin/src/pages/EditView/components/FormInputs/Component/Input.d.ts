import * as React from 'react';
import { InputProps } from '@strapi/admin/strapi-admin';
import { EditFieldLayout } from '../../../../../hooks/useDocumentLayout';
import { type InputRendererProps } from '../../InputRenderer';
interface ComponentInputProps extends Omit<Extract<EditFieldLayout, {
    type: 'component';
}>, 'size' | 'hint'>, Pick<InputProps, 'hint'> {
    labelAction?: React.ReactNode;
    children: (props: InputRendererProps) => React.ReactNode;
    /**
     * We need layout to come from the props, and not via a hook, because Content History needs
     * a way to modify the normal component layout to add hidden fields.
     */
    layout: EditFieldLayout[][];
}
declare const MemoizedComponentInput: React.MemoExoticComponent<({ label, required, name, attribute, disabled, labelAction, ...props }: ComponentInputProps) => import("react/jsx-runtime").JSX.Element>;
export { MemoizedComponentInput as ComponentInput };
export type { ComponentInputProps };
