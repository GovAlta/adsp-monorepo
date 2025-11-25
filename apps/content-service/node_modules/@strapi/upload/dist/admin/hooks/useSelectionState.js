'use strict';

var React = require('react');

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

const useSelectionState = (keys, initialValue)=>{
    const [selections, setSelections] = React__namespace.useState(initialValue);
    const selectOne = (selection)=>{
        const index = selections.findIndex((currentSelection)=>keys.every((key)=>currentSelection[key] === selection[key]));
        if (index > -1) {
            setSelections((prevSelected)=>[
                    ...prevSelected.slice(0, index),
                    ...prevSelected.slice(index + 1)
                ]);
        } else {
            setSelections((prevSelected)=>[
                    ...prevSelected,
                    selection
                ]);
        }
    };
    const selectAll = (nextSelections)=>{
        if (selections.length > 0) {
            setSelections([]);
        } else {
            setSelections(nextSelections);
        }
    };
    const selectOnly = (nextSelection)=>{
        const index = selections.findIndex((currentSelection)=>keys.every((key)=>currentSelection[key] === nextSelection[key]));
        if (index > -1) {
            setSelections([]);
        } else {
            setSelections([
                nextSelection
            ]);
        }
    };
    const selectMultiple = (nextSelections)=>{
        setSelections((currSelections)=>[
                // already selected items
                ...currSelections,
                // filter out already selected items from nextSelections
                ...nextSelections.filter((nextSelection)=>currSelections.findIndex((currentSelection)=>keys.every((key)=>currentSelection[key] === nextSelection[key])) === -1)
            ]);
    };
    const deselectMultiple = (nextSelections)=>{
        setSelections((currSelections)=>[
                // filter out items in currSelections that are in nextSelections
                ...currSelections.filter((currentSelection)=>nextSelections.findIndex((nextSelection)=>keys.every((key)=>currentSelection[key] === nextSelection[key])) === -1)
            ]);
    };
    return [
        selections,
        {
            selectOne,
            selectAll,
            selectOnly,
            selectMultiple,
            deselectMultiple,
            setSelections
        }
    ];
};

exports.useSelectionState = useSelectionState;
//# sourceMappingURL=useSelectionState.js.map
