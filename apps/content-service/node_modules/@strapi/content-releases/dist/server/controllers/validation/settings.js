'use strict';

var utils = require('@strapi/utils');
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

const SETTINGS_SCHEMA = yup__namespace.object().shape({
    defaultTimezone: yup__namespace.string().nullable().default(null)
}).required().noUnknown();
const validateSettings = utils.validateYupSchema(SETTINGS_SCHEMA);

exports.SETTINGS_SCHEMA = SETTINGS_SCHEMA;
exports.validateSettings = validateSettings;
//# sourceMappingURL=settings.js.map
