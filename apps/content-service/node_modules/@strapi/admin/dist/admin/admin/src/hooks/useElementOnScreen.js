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

/**
 * Hook that returns a ref to an element and a boolean indicating if the element is in the viewport
 * or in the element specified in `options.root`.
 */ const useElementOnScreen = (onVisiblityChange, options)=>{
    const containerRef = React__namespace.useRef(null);
    React__namespace.useEffect(()=>{
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

exports.useElementOnScreen = useElementOnScreen;
//# sourceMappingURL=useElementOnScreen.js.map
