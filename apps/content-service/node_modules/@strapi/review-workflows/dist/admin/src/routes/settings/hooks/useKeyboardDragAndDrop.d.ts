import * as React from 'react';
export type UseKeyboardDragAndDropCallbacks<TIndex extends number | Array<number> = number> = {
    onCancel?: (index: TIndex) => void;
    onDropItem?: (currentIndex: TIndex, newIndex?: TIndex) => void;
    onGrabItem?: (index: TIndex) => void;
    onMoveItem?: (newIndex: TIndex, currentIndex: TIndex) => void;
};
/**
 * Utility hook designed to implement keyboard accessibile drag and drop by
 * returning an onKeyDown handler to be passed to the drag icon button.
 *
 * @internal - You should use `useDragAndDrop` instead.
 */
export declare const useKeyboardDragAndDrop: <TIndex extends number | number[] = number>(active: boolean, index: TIndex, { onCancel, onDropItem, onGrabItem, onMoveItem }: UseKeyboardDragAndDropCallbacks<TIndex>) => <E extends Element>(e: React.KeyboardEvent<E>) => void;
