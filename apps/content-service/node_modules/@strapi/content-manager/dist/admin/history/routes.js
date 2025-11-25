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

const ProtectedHistoryPage = /*#__PURE__*/ React__namespace.lazy(()=>Promise.resolve().then(function () { return require('./pages/History.js'); }).then((mod)=>({
            default: mod.ProtectedHistoryPage
        })));
/**
 * These routes will be merged with the rest of the Content Manager routes
 */ const routes = [
    {
        path: ':collectionType/:slug/:id/history',
        Component: ProtectedHistoryPage
    },
    {
        path: ':collectionType/:slug/history',
        Component: ProtectedHistoryPage
    }
];

exports.routes = routes;
//# sourceMappingURL=routes.js.map
