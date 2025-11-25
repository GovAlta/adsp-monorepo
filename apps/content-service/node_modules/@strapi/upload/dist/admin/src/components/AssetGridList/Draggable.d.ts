import * as React from 'react';
interface DraggableProps {
    id: string | number;
    index: number;
    children: React.ReactNode;
    moveItem: (fromIndex: number, toIndex: number) => void;
}
export declare const Draggable: ({ children, id, index, moveItem }: DraggableProps) => import("react/jsx-runtime").JSX.Element;
export {};
