'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');

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

const ObservedToolbarComponent = ({ index, lastVisibleIndex, setLastVisibleIndex, rootRef, children })=>{
    const isVisible = index <= lastVisibleIndex;
    const containerRef = strapiAdmin.useElementOnScreen((isVisible)=>{
        /**
       * It's the MoreMenu's job to make an item not visible when there's not room for it.
       * But we need to react here to the element becoming visible again.
       */ if (isVisible) {
            setLastVisibleIndex((prev)=>Math.max(prev, index));
        }
    }, {
        threshold: 1,
        root: rootRef.current
    });
    return /*#__PURE__*/ jsxRuntime.jsx("div", {
        ref: containerRef,
        style: {
            /**
         * Use visibility so that the element occupies the space if requires even when there's not
         * enough room for it to be visible. The empty reserved space will be clipped by the
         * overflow:hidden rule on the parent, so it doesn't affect the UI.
         * This way we can keep observing its visiblity and react to browser resize events.
         */ visibility: isVisible ? 'visible' : 'hidden'
        },
        children: children
    });
};
const EditorToolbarObserver = ({ observedComponents, menuTriggerVariant = 'ghost' })=>{
    const { formatMessage } = reactIntl.useIntl();
    const toolbarRef = React__namespace.useRef(null);
    const [lastVisibleIndex, setLastVisibleIndex] = React__namespace.useState(observedComponents.length - 1);
    const hasHiddenItems = lastVisibleIndex < observedComponents.length - 1;
    const menuIndex = lastVisibleIndex + 1;
    const [open, setOpen] = React__namespace.useState(false);
    const isMenuOpenWithContent = open && hasHiddenItems;
    const menuTriggerRef = strapiAdmin.useElementOnScreen((isVisible)=>{
        // We only react to the menu becoming invisible. When that happens, we hide the last item.
        if (!isVisible) {
            /**
         * If there's no room for any item, the index can be -1.
         * This is intentional, in that case only the more menu will be visible.
         **/ setLastVisibleIndex((prev)=>prev - 1);
            // Maintain the menu state if it has content
            setOpen(isMenuOpenWithContent);
        }
    }, {
        threshold: 1,
        root: toolbarRef.current
    });
    return observedComponents.map((component, index)=>{
        return /*#__PURE__*/ jsxRuntime.jsx(ObservedToolbarComponent, {
            index: index,
            lastVisibleIndex: lastVisibleIndex,
            setLastVisibleIndex: setLastVisibleIndex,
            rootRef: toolbarRef,
            children: component.toolbar
        }, component.key);
    }).toSpliced(menuIndex, 0, /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
        defaultOpen: false,
        open: isMenuOpenWithContent,
        onOpenChange: setOpen,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Trigger, {
                paddingLeft: 0,
                paddingRight: 0,
                ref: menuTriggerRef,
                variant: menuTriggerVariant,
                style: {
                    visibility: hasHiddenItems ? 'visible' : 'hidden'
                },
                label: formatMessage({
                    id: 'global.more',
                    defaultMessage: 'More'
                }),
                tag: designSystem.IconButton,
                icon: /*#__PURE__*/ jsxRuntime.jsx(Icons.More, {})
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Content, {
                onCloseAutoFocus: (e)=>e.preventDefault(),
                maxHeight: "100%",
                minWidth: "256px",
                popoverPlacement: "bottom-end",
                zIndex: 2,
                children: observedComponents.slice(menuIndex).map((component)=>/*#__PURE__*/ jsxRuntime.jsx(React__namespace.Fragment, {
                        children: component.menu
                    }, component.key))
            })
        ]
    }, "more-menu"));
};

exports.EditorToolbarObserver = EditorToolbarObserver;
//# sourceMappingURL=EditorToolbarObserver.js.map
