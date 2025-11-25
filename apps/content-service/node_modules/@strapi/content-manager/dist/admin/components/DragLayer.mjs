import { jsx } from 'react/jsx-runtime';
import 'react';
import { Box } from '@strapi/design-system';
import { useDragLayer } from 'react-dnd';

function getStyle(initialOffset, currentOffset, mouseOffset) {
    if (!initialOffset || !currentOffset || !mouseOffset) {
        return {
            display: 'none'
        };
    }
    const { x, y } = mouseOffset;
    return {
        transform: `translate(${x}px, ${y}px)`
    };
}
const DragLayer = ({ renderItem })=>{
    const { itemType, isDragging, item, initialOffset, currentOffset, mouseOffset } = useDragLayer((monitor)=>({
            item: monitor.getItem(),
            itemType: monitor.getItemType(),
            initialOffset: monitor.getInitialSourceClientOffset(),
            currentOffset: monitor.getSourceClientOffset(),
            isDragging: monitor.isDragging(),
            mouseOffset: monitor.getClientOffset()
        }));
    if (!isDragging) {
        return null;
    }
    return /*#__PURE__*/ jsx(Box, {
        height: "100%",
        left: 0,
        position: "fixed",
        pointerEvents: "none",
        top: 0,
        zIndex: 100,
        width: "100%",
        children: /*#__PURE__*/ jsx(Box, {
            style: getStyle(initialOffset, currentOffset, mouseOffset),
            children: renderItem({
                type: itemType,
                item
            })
        })
    });
};

export { DragLayer };
//# sourceMappingURL=DragLayer.mjs.map
