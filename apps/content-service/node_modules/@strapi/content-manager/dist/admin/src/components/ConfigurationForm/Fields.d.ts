import * as React from 'react';
import { EditFieldFormProps } from './EditFieldForm';
import type { EditLayout } from '../../hooks/useDocumentLayout';
export declare const SortableItem: ({ id, children }: {
    id: string;
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
interface FieldsProps extends Pick<EditLayout, 'metadatas'>, Pick<FieldProps, 'components'> {
    attributes: {
        [key: string]: FieldProps['attribute'];
    };
    fieldSizes: Record<string, number>;
    components: EditLayout['components'];
}
declare const Fields: ({ attributes, fieldSizes, components, metadatas }: FieldsProps) => import("react/jsx-runtime").JSX.Element;
interface FieldProps extends Pick<EditFieldFormProps, 'name' | 'attribute'> {
    components: EditLayout['components'];
    dndId: string;
    onRemoveField?: React.MouseEventHandler<HTMLButtonElement>;
}
declare const TEMP_FIELD_NAME = "_TEMP_";
export { Fields, TEMP_FIELD_NAME };
export type { FieldsProps };
