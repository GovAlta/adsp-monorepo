'use strict';

var locales = require('date-fns/locale');

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

var locales__namespace = /*#__PURE__*/_interopNamespaceDefault(locales);

/**
 * Returns a valid date-fns locale name from a Strapi Admin locale.
 * Defaults to 'enUS' if the locale is not found.
 */ const getDateFnsLocaleName = (locale)=>{
    if (Object.keys(locales__namespace).includes(locale)) {
        return locale;
    }
    return 'enUS';
};

exports.getDateFnsLocaleName = getDateFnsLocaleName;
//# sourceMappingURL=locales.js.map
