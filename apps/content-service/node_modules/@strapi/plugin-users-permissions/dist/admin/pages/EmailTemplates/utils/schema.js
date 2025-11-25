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

const schema = yup__namespace.object().shape({
    options: yup__namespace.object().shape({
        from: yup__namespace.object().shape({
            name: yup__namespace.string().required({
                id: admin.translatedErrors.required.id,
                defaultMessage: 'This field is required'
            }),
            email: yup__namespace.string().email(admin.translatedErrors.email).required({
                id: admin.translatedErrors.required.id,
                defaultMessage: 'This field is required'
            })
        }).required(),
        response_email: yup__namespace.string().email(admin.translatedErrors.email),
        object: yup__namespace.string().required({
            id: admin.translatedErrors.required.id,
            defaultMessage: 'This field is required'
        }),
        message: yup__namespace.string().required({
            id: admin.translatedErrors.required.id,
            defaultMessage: 'This field is required'
        })
    }).required(admin.translatedErrors.required.id)
});

module.exports = schema;
//# sourceMappingURL=schema.js.map
