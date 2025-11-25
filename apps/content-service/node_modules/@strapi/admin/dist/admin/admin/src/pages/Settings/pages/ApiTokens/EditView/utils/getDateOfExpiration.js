'use strict';

var dateFns = require('date-fns');
var locales = require('date-fns/locale');
var locales$1 = require('../../../../../../utils/locales.js');

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

const getDateOfExpiration = (createdAt, duration, language = 'en')=>{
    if (duration && typeof duration === 'number') {
        const durationInDays = duration / 24 / 60 / 60 / 1000;
        return dateFns.format(dateFns.addDays(new Date(createdAt), durationInDays), 'PPP', {
            locale: locales__namespace[locales$1.getDateFnsLocaleName(language)]
        });
    }
    return 'Unlimited';
};

exports.getDateOfExpiration = getDateOfExpiration;
//# sourceMappingURL=getDateOfExpiration.js.map
