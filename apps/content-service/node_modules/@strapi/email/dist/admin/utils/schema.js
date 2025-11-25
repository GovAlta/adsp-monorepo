'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var yup = require('yup');

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
    email: yup__namespace.string().email(strapiAdmin.translatedErrors.email.id).required(strapiAdmin.translatedErrors.required.id)
});

exports.schema = schema;
//# sourceMappingURL=schema.js.map
