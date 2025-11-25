import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useDrop, useDrag } from 'react-dnd';

const Draggable = ({ children, id, index, moveItem })=>{
    const ref = React.useRef(null);
    const [, drop] = useDrop({
        accept: 'draggable',
        hover (hoveredOverItem) {
            if (!ref.current) {
                return;
            }
            if (hoveredOverItem.id !== id) {
                moveItem(hoveredOverItem.index, index);
                hoveredOverItem.index = index;
            }
        }
    });
    const [{ isDragging }, drag] = useDrag({
        type: 'draggable',
        item () {
            return {
                index,
                id
            };
        },
        collect: (monitor)=>({
                isDragging: monitor.isDragging()
            })
    });
    const opacity = isDragging ? 0.2 : 1;
    drag(drop(ref));
    return /*#__PURE__*/ jsx("div", {
        ref: ref,
        style: {
            opacity,
            cursor: 'move'
        },
        children: children
    });
};

export { Draggable };
//# sourceMappingURL=Draggable.mjs.map
