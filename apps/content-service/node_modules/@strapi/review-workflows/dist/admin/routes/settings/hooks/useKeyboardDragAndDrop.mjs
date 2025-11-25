import * as React from 'react';

/**
 * Utility hook designed to implement keyboard accessibile drag and drop by
 * returning an onKeyDown handler to be passed to the drag icon button.
 *
 * @internal - You should use `useDragAndDrop` instead.
 */ const useKeyboardDragAndDrop = (active, index, { onCancel, onDropItem, onGrabItem, onMoveItem })=>{
    const [isSelected, setIsSelected] = React.useState(false);
    const handleMove = (movement)=>{
        if (!isSelected) {
            return;
        }
        if (typeof index === 'number' && onMoveItem) {
            if (movement === 'UP') {
                onMoveItem(index - 1, index);
            } else if (movement === 'DOWN') {
                onMoveItem(index + 1, index);
            }
        }
    };
    const handleDragClick = ()=>{
        if (isSelected) {
            if (onDropItem) {
                onDropItem(index);
            }
            setIsSelected(false);
        } else {
            if (onGrabItem) {
                onGrabItem(index);
            }
            setIsSelected(true);
        }
    };
    const handleCancel = ()=>{
        if (isSelected) {
            setIsSelected(false);
            if (onCancel) {
                onCancel(index);
            }
        }
    };
    const handleKeyDown = (e)=>{
        if (!active) {
            return;
        }
        if (e.key === 'Tab' && !isSelected) {
            return;
        }
        e.preventDefault();
        switch(e.key){
            case ' ':
            case 'Enter':
                handleDragClick();
                break;
            case 'Escape':
                handleCancel();
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                handleMove('DOWN');
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                handleMove('UP');
                break;
        }
    };
    return handleKeyDown;
};

export { useKeyboardDragAndDrop };
//# sourceMappingURL=useKeyboardDragAndDrop.mjs.map
