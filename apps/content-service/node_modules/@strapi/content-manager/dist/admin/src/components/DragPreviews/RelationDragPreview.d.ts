import type { Data } from '@strapi/types';
interface RelationDragPreviewProps {
    status?: string;
    displayedValue: string;
    id: Data.ID;
    index: number;
    width: number;
}
declare const RelationDragPreview: ({ status, displayedValue, width }: RelationDragPreviewProps) => import("react/jsx-runtime").JSX.Element;
export { RelationDragPreview };
export type { RelationDragPreviewProps };
