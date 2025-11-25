'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');

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

const SimpleMenu = /*#__PURE__*/ React__namespace.forwardRef(({ children, onOpen, onClose, popoverPlacement, ...props }, forwardedRef)=>{
    const triggerRef = React__namespace.useRef(null);
    const composedRef = designSystem.useComposedRefs(forwardedRef, triggerRef);
    const handleOpenChange = (isOpen)=>{
        if (isOpen && typeof onOpen === 'function') {
            onOpen();
        } else if (!isOpen && typeof onClose === 'function') {
            onClose();
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
        onOpenChange: handleOpenChange,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Trigger, {
                ref: composedRef,
                ...props,
                children: props.label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Content, {
                zIndex: 10000,
                popoverPlacement: popoverPlacement,
                children: children
            })
        ]
    });
});
const MenuItem = designSystem.Menu.Item;

Object.defineProperty(exports, "Menu", {
  enumerable: true,
  get: function () { return designSystem.Menu; }
});
exports.MenuItem = MenuItem;
exports.SimpleMenu = SimpleMenu;
//# sourceMappingURL=SimpleMenu.js.map
