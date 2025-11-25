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

// eslint-disable-next-line prefer-regex-literals
const URL_REGEX = new RegExp('(^$)|((.+:\\/\\/.*)(d*)\\/?(.*))');
const schema = yup__namespace.object().shape({
    email_confirmation_redirection: yup__namespace.mixed().when('email_confirmation', {
        is: true,
        then: yup__namespace.string().matches(URL_REGEX).required(),
        otherwise: yup__namespace.string().nullable()
    }),
    email_reset_password: yup__namespace.string(admin.translatedErrors.string).matches(URL_REGEX, {
        id: admin.translatedErrors.regex.id,
        defaultMessage: 'This is not a valid URL'
    }).nullable()
});

module.exports = schema;
//# sourceMappingURL=schema.js.map
