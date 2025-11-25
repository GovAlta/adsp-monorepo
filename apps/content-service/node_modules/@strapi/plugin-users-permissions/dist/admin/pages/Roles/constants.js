'use strict';

var admin = require('@strapi/strapi/admin');
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

const createRoleSchema = yup__namespace.object().shape({
    name: yup__namespace.string().required(admin.translatedErrors.required.id),
    description: yup__namespace.string().required(admin.translatedErrors.required.id)
});

exports.createRoleSchema = createRoleSchema;
//# sourceMappingURL=constants.js.map
