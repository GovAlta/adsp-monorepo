'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var reactDnd = require('react-dnd');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const Draggable = ({ children, id, index, moveItem })=>{
    const ref = React__namespace.useRef(null);
    const [, drop] = reactDnd.useDrop({
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
    const [{ isDragging }, drag] = reactDnd.useDrag({
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
    return /*#__PURE__*/ jsxRuntime.jsx("div", {
        ref: ref,
        style: {
            opacity,
            cursor: 'move'
        },
        children: children
    });
};

exports.Draggable = Draggable;
//# sourceMappingURL=Draggable.js.map
