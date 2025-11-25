import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Menu, useComposedRefs } from '@strapi/design-system';
export { Menu } from '@strapi/design-system';

const SimpleMenu = /*#__PURE__*/ React.forwardRef(({ children, onOpen, onClose, popoverPlacement, ...props }, forwardedRef)=>{
    const triggerRef = React.useRef(null);
    const composedRef = useComposedRefs(forwardedRef, triggerRef);
    const handleOpenChange = (isOpen)=>{
        if (isOpen && typeof onOpen === 'function') {
            onOpen();
        } else if (!isOpen && typeof onClose === 'function') {
            onClose();
        }
    };
    return /*#__PURE__*/ jsxs(Menu.Root, {
        onOpenChange: handleOpenChange,
        children: [
            /*#__PURE__*/ jsx(Menu.Trigger, {
                ref: composedRef,
                ...props,
                children: props.label
            }),
            /*#__PURE__*/ jsx(Menu.Content, {
                zIndex: 10000,
                popoverPlacement: popoverPlacement,
                children: children
            })
        ]
    });
});
const MenuItem = Menu.Item;

export { MenuItem, SimpleMenu };
//# sourceMappingURL=SimpleMenu.mjs.map
