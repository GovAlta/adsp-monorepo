import { jsx } from 'react/jsx-runtime';
import { useState, useRef, useLayoutEffect, createContext, useContext } from 'react';
import { Box } from '@strapi/design-system';
import { styled } from 'styled-components';

const CollapsibleContext = /*#__PURE__*/ createContext(undefined);
const useCollapsible = ()=>{
    const context = useContext(CollapsibleContext);
    if (!context) {
        throw new Error('Collapsible components must be wrapped in <Collapsible />');
    }
    return context;
};
const AnimatedContent = styled(Box)`
  overflow: hidden;
  transition: height ${({ theme })=>theme.motion.timings['200']}
    ${({ theme })=>theme.motion.easings.easeOutQuad};
`;
const Collapsible = ({ children, defaultOpen = false })=>{
    const [open, setOpen] = useState(defaultOpen);
    return /*#__PURE__*/ jsx(CollapsibleContext.Provider, {
        value: {
            open,
            toggle: ()=>setOpen((prev)=>!prev)
        },
        children: children
    });
};
const CollapsibleTrigger = ({ children })=>{
    const { toggle, open } = useCollapsible();
    return /*#__PURE__*/ jsx(Box, {
        onClick: toggle,
        style: {
            cursor: 'pointer'
        },
        children: typeof children === 'function' ? children({
            open
        }) : children
    });
};
const CollapsibleContent = ({ children })=>{
    const { open } = useCollapsible();
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);
    useLayoutEffect(()=>{
        if (contentRef.current) {
            const contentHeight = contentRef.current.scrollHeight;
            setHeight(contentHeight);
        }
    }, [
        children
    ]);
    return /*#__PURE__*/ jsx(AnimatedContent, {
        ref: contentRef,
        role: "region",
        "aria-hidden": !open,
        style: {
            height: open ? `${height}px` : 0,
            visibility: height === 0 ? 'hidden' : 'visible'
        },
        children: children
    });
};

export { Collapsible, CollapsibleContent, CollapsibleTrigger, useCollapsible };
//# sourceMappingURL=Collapsible.mjs.map
