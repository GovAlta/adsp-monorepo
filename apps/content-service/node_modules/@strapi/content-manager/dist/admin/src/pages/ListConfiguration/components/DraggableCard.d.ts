import type { ListFieldLayout } from '../../../hooks/useDocumentLayout';
type DraggableCardProps = Omit<ListFieldLayout, 'label'> & {
    label: string;
    index: number;
    isDraggingSibling: boolean;
    onMoveField: (dragIndex: number, hoverIndex: number) => void;
    onRemoveField: () => void;
    setIsDraggingSibling: (isDragging: boolean) => void;
};
declare const DraggableCard: ({ attribute, index, isDraggingSibling, label, name, onMoveField, onRemoveField, setIsDraggingSibling, }: DraggableCardProps) => import("react/jsx-runtime").JSX.Element;
export { DraggableCard };
export type { DraggableCardProps };
