import type { Schema } from '@strapi/types';
interface CellValueProps {
    type: Schema.Attribute.Kind | 'custom';
    value: any;
}
declare const CellValue: ({ type, value }: CellValueProps) => string;
export { CellValue };
export type { CellValueProps };
