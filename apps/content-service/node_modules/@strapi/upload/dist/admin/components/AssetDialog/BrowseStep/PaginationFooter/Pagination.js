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

const PaginationContext = /*#__PURE__*/ React__namespace.createContext({
    activePage: 1,
    pageCount: 1
});
const usePagination = ()=>React__namespace.useContext(PaginationContext);
const Pagination = ({ children, activePage, pageCount, label = 'pagination' })=>{
    const paginationValue = React__namespace.useMemo(()=>({
            activePage,
            pageCount
        }), [
        activePage,
        pageCount
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(PaginationContext.Provider, {
        value: paginationValue,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            tag: "nav",
            "aria-label": label,
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                tag: "ul",
                gap: 1,
                children: children
            })
        })
    });
};

exports.Pagination = Pagination;
exports.usePagination = usePagination;
//# sourceMappingURL=Pagination.js.map
