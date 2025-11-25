'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactDnd = require('react-dnd');

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
    const { itemType, isDragging, item, initialOffset, currentOffset, mouseOffset } = reactDnd.useDragLayer((monitor)=>({
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        height: "100%",
        left: 0,
        position: "fixed",
        pointerEvents: "none",
        top: 0,
        zIndex: 100,
        width: "100%",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            style: getStyle(initialOffset, currentOffset, mouseOffset),
            children: renderItem({
                type: itemType,
                item
            })
        })
    });
};

exports.DragLayer = DragLayer;
//# sourceMappingURL=DragLayer.js.map
