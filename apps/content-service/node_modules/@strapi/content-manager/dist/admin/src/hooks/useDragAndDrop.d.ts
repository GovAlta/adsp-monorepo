import * as React from 'react';
import { type HandlerManager, type ConnectDragSource, type ConnectDropTarget, type ConnectDragPreview } from 'react-dnd';
import { type UseKeyboardDragAndDropCallbacks } from './useKeyboardDragAndDrop';
import type { Data } from '@strapi/types';
declare const DIRECTIONS: {
    readonly UPWARD: "upward";
    readonly DOWNWARD: "downward";
};
declare const DROP_SENSITIVITY: {
    readonly REGULAR: "regular";
    readonly IMMEDIATE: "immediate";
};
interface UseDragAndDropOptions<TIndex extends number | Array<number> = number, TItem extends {
    index: TIndex;
} = {
    index: TIndex;
}> extends UseKeyboardDragAndDropCallbacks<TIndex> {
    type?: string;
    index: TIndex;
    item?: TItem;
    onStart?: () => void;
    onEnd?: () => void;
    dropSensitivity?: (typeof DROP_SENSITIVITY)[keyof typeof DROP_SENSITIVITY];
}
type Identifier = ReturnType<HandlerManager['getHandlerId']>;
type UseDragAndDropReturn<E extends Element = HTMLElement> = [
    props: {
        handlerId: Identifier;
        isDragging: boolean;
        handleKeyDown: <E extends Element>(event: React.KeyboardEvent<E>) => void;
        isOverDropTarget: boolean;
        direction: (typeof DIRECTIONS)[keyof typeof DIRECTIONS] | null;
    },
    objectRef: React.RefObject<E>,
    dropRef: ConnectDropTarget,
    dragRef: ConnectDragSource,
    dragPreviewRef: ConnectDragPreview
];
/**
 * A utility hook abstracting the general drag and drop hooks from react-dnd.
 * Centralising the same behaviours and by default offering keyboard support.
 */
declare const useDragAndDrop: <TIndex extends number | number[], TItem extends {
    [key: string]: unknown;
    index: TIndex;
    id?: Data.ID | undefined;
} = {
    [key: string]: unknown;
    index: TIndex;
}, E extends Element = HTMLElement>(active: boolean, { type, index, item, onStart, onEnd, onGrabItem, onDropItem, onCancel, onMoveItem, dropSensitivity, }: UseDragAndDropOptions<TIndex, TItem>) => UseDragAndDropReturn<E>;
export { useDragAndDrop, UseDragAndDropReturn, UseDragAndDropOptions, DIRECTIONS, DROP_SENSITIVITY, };
