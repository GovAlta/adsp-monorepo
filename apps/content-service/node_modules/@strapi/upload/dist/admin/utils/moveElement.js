'use strict';

const move = (array, oldIndex, newIndex)=>{
    if (newIndex >= array.length) {
        newIndex = array.length - 1;
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    return array;
};
const moveElement = (array, index, offset)=>{
    const newIndex = index + offset;
    return move(array, index, newIndex);
};

exports.moveElement = moveElement;
//# sourceMappingURL=moveElement.js.map
