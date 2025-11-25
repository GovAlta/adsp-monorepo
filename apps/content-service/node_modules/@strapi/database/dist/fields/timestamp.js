'use strict';

var dateFns = require('date-fns');
var parsers = require('./shared/parsers.js');
var field = require('./field.js');

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

var dateFns__namespace = /*#__PURE__*/_interopNamespaceDefault(dateFns);

class TimestampField extends field {
    toDB(value) {
        return parsers.parseDateTimeOrTimestamp(value);
    }
    fromDB(value) {
        const cast = new Date(value);
        return dateFns__namespace.isValid(cast) ? dateFns__namespace.format(cast, 'T') : null;
    }
}

module.exports = TimestampField;
//# sourceMappingURL=timestamp.js.map
