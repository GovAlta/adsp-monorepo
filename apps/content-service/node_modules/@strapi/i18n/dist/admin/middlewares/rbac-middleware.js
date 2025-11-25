'use strict';

var qs = require('qs');
var reactRouterDom = require('react-router-dom');

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

var qs__namespace = /*#__PURE__*/_interopNamespaceDefault(qs);

const localeMiddleware = (ctx)=>(next)=>(permissions)=>{
            const match = reactRouterDom.matchPath('/content-manager/:collectionType/:model?/:id', ctx.pathname);
            if (!match) {
                return next(permissions);
            }
            const search = qs__namespace.parse(ctx.search);
            if (typeof search !== 'object') {
                return next(permissions);
            }
            if (!('plugins' in search && typeof search.plugins === 'object')) {
                return next(permissions);
            }
            if (!('i18n' in search.plugins && typeof search.plugins.i18n === 'object' && !Array.isArray(search.plugins.i18n))) {
                return next(permissions);
            }
            const { locale } = search.plugins.i18n;
            if (typeof locale !== 'string') {
                return next(permissions);
            }
            const revisedPermissions = permissions.filter((permission)=>!permission.properties?.locales || permission.properties.locales.includes(locale));
            return next(revisedPermissions);
        };

exports.localeMiddleware = localeMiddleware;
//# sourceMappingURL=rbac-middleware.js.map
