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

const ProtectedPreviewPage = /*#__PURE__*/ React__namespace.lazy(()=>Promise.resolve().then(function () { return require('./pages/Preview.js'); }).then((mod)=>({
            default: mod.ProtectedPreviewPage
        })));
const routes = [
    {
        path: ':collectionType/:slug/:id/preview',
        Component: ProtectedPreviewPage
    },
    {
        path: ':collectionType/:slug/preview',
        Component: ProtectedPreviewPage
    }
];

exports.routes = routes;
//# sourceMappingURL=routes.js.map
