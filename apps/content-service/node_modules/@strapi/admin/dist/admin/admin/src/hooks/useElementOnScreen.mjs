import * as React from 'react';

/**
 * Hook that returns a ref to an element and a boolean indicating if the element is in the viewport
 * or in the element specified in `options.root`.
 */ const useElementOnScreen = (onVisiblityChange, options)=>{
    const containerRef = React.useRef(null);
    React.useEffect(()=>{
        const containerEl = containerRef.current;
        const observer = new IntersectionObserver(([entry])=>{
            onVisiblityChange(entry.isIntersecting);
        }, options);
        if (containerEl) {
            observer.observe(containerRef.current);
        }
        return ()=>{
            if (containerEl) {
                observer.disconnect();
            }
        };
    }, [
        containerRef,
        options,
        onVisiblityChange
    ]);
    return containerRef;
};

export { useElementOnScreen };
//# sourceMappingURL=useElementOnScreen.mjs.map
