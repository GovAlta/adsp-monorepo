'use strict';

var yup = require('yup');
var strapiUtils = require('@strapi/utils');

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

const historyRestoreVersionSchema = yup__namespace.object().shape({
    contentType: yup__namespace.string().trim().required()
}).required();
const validateRestoreVersion = strapiUtils.validateYupSchema(historyRestoreVersionSchema);

exports.validateRestoreVersion = validateRestoreVersion;
//# sourceMappingURL=history-version.js.map
