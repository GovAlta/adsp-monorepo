'use strict';

var React = require('react');
var styled = require('styled-components');

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
 * Hook to detect if a media query matches
 * @param query - Media query string (e.g., '(min-width: 768px)' or theme.breakpoints.large)
 * @returns boolean indicating if the media query matches
 */ const useMediaQuery = (query)=>{
    const cleanQuery = query.replace('@media', '').trim();
    const [matches, setMatches] = React__namespace.useState(()=>window.matchMedia(cleanQuery).matches);
    React__namespace.useEffect(()=>{
        const mediaQuery = window.matchMedia(cleanQuery);
        const handler = (e)=>setMatches(e.matches);
        mediaQuery.addEventListener('change', handler);
        return ()=>mediaQuery.removeEventListener('change', handler);
    }, [
        cleanQuery
    ]);
    return matches;
};
/**
 * Hook to detect if the current viewport is desktop size
 * Uses the theme's large breakpoint
 */ const useIsDesktop = ()=>{
    const theme = styled.useTheme();
    return useMediaQuery(theme.breakpoints.large);
};
/**
 * Hook to detect if the current viewport is tablet size
 * Uses the theme's medium breakpoint
 */ const useIsTablet = ()=>{
    const theme = styled.useTheme();
    const isTabletOrAbove = useMediaQuery(theme.breakpoints.medium);
    const isDesktop = useMediaQuery(theme.breakpoints.large);
    return isTabletOrAbove && !isDesktop;
};
/**
 * Hook to detect if the current viewport is mobile size
 * Uses the theme's medium breakpoint (inverted)
 */ const useIsMobile = ()=>{
    const theme = styled.useTheme();
    return !useMediaQuery(theme.breakpoints.medium);
};

exports.useIsDesktop = useIsDesktop;
exports.useIsMobile = useIsMobile;
exports.useIsTablet = useIsTablet;
exports.useMediaQuery = useMediaQuery;
//# sourceMappingURL=useMediaQuery.js.map
