import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useElementOnScreen } from '@strapi/admin/strapi-admin';
import { Menu, IconButton } from '@strapi/design-system';
import { More } from '@strapi/icons';
import { useIntl } from 'react-intl';

const ObservedToolbarComponent = ({ index, lastVisibleIndex, setLastVisibleIndex, rootRef, children })=>{
    const isVisible = index <= lastVisibleIndex;
    const containerRef = useElementOnScreen((isVisible)=>{
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
    return /*#__PURE__*/ jsx("div", {
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
    const { formatMessage } = useIntl();
    const toolbarRef = React.useRef(null);
    const [lastVisibleIndex, setLastVisibleIndex] = React.useState(observedComponents.length - 1);
    const hasHiddenItems = lastVisibleIndex < observedComponents.length - 1;
    const menuIndex = lastVisibleIndex + 1;
    const [open, setOpen] = React.useState(false);
    const isMenuOpenWithContent = open && hasHiddenItems;
    const menuTriggerRef = useElementOnScreen((isVisible)=>{
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
        return /*#__PURE__*/ jsx(ObservedToolbarComponent, {
            index: index,
            lastVisibleIndex: lastVisibleIndex,
            setLastVisibleIndex: setLastVisibleIndex,
            rootRef: toolbarRef,
            children: component.toolbar
        }, component.key);
    }).toSpliced(menuIndex, 0, /*#__PURE__*/ jsxs(Menu.Root, {
        defaultOpen: false,
        open: isMenuOpenWithContent,
        onOpenChange: setOpen,
        children: [
            /*#__PURE__*/ jsx(Menu.Trigger, {
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
                tag: IconButton,
                icon: /*#__PURE__*/ jsx(More, {})
            }),
            /*#__PURE__*/ jsx(Menu.Content, {
                onCloseAutoFocus: (e)=>e.preventDefault(),
                maxHeight: "100%",
                minWidth: "256px",
                popoverPlacement: "bottom-end",
                zIndex: 2,
                children: observedComponents.slice(menuIndex).map((component)=>/*#__PURE__*/ jsx(React.Fragment, {
                        children: component.menu
                    }, component.key))
            })
        ]
    }, "more-menu"));
};

export { EditorToolbarObserver };
//# sourceMappingURL=EditorToolbarObserver.mjs.map
