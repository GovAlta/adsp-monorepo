'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

const CollapsibleContext = /*#__PURE__*/ React.createContext(undefined);
const useCollapsible = ()=>{
    const context = React.useContext(CollapsibleContext);
    if (!context) {
        throw new Error('Collapsible components must be wrapped in <Collapsible />');
    }
    return context;
};
const AnimatedContent = styledComponents.styled(designSystem.Box)`
  overflow: hidden;
  transition: height ${({ theme })=>theme.motion.timings['200']}
    ${({ theme })=>theme.motion.easings.easeOutQuad};
`;
const Collapsible = ({ children, defaultOpen = false })=>{
    const [open, setOpen] = React.useState(defaultOpen);
    return /*#__PURE__*/ jsxRuntime.jsx(CollapsibleContext.Provider, {
        value: {
            open,
            toggle: ()=>setOpen((prev)=>!prev)
        },
        children: children
    });
};
const CollapsibleTrigger = ({ children })=>{
    const { toggle, open } = useCollapsible();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
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
    const contentRef = React.useRef(null);
    const [height, setHeight] = React.useState(0);
    React.useLayoutEffect(()=>{
        if (contentRef.current) {
            const contentHeight = contentRef.current.scrollHeight;
            setHeight(contentHeight);
        }
    }, [
        children
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(AnimatedContent, {
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

exports.Collapsible = Collapsible;
exports.CollapsibleContent = CollapsibleContent;
exports.CollapsibleTrigger = CollapsibleTrigger;
exports.useCollapsible = useCollapsible;
//# sourceMappingURL=Collapsible.js.map
