'use strict';

var yup = require('yup');
var translatedErrors = require('../../../../../utils/translatedErrors.js');

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

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const schema = yup__namespace.object().shape({
    name: yup__namespace.string().max(100).required(translatedErrors.translatedErrors.required.id),
    type: yup__namespace.string().oneOf([
        'read-only',
        'full-access',
        'custom'
    ]).required(translatedErrors.translatedErrors.required.id),
    description: yup__namespace.string().nullable(),
    lifespan: yup__namespace.number().integer().min(0).nullable().defined(translatedErrors.translatedErrors.required.id)
});

exports.schema = schema;
//# sourceMappingURL=constants.js.map
