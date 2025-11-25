import type { ListFieldLayout } from '../../../../hooks/useDocumentLayout';
import type { Schema, Data } from '@strapi/types';
interface CellContentProps extends Omit<ListFieldLayout, 'cellFormatter'> {
    content: Schema.Attribute.Value<Schema.Attribute.AnyAttribute>;
    rowId: Data.ID;
}
declare const CellContent: ({ content, mainField, attribute, rowId, name }: CellContentProps) => import("react/jsx-runtime").JSX.Element;
export { CellContent };
export type { CellContentProps };
