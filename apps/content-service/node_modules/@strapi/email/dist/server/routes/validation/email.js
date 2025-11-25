'use strict';

var z = require('zod/v4');

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

var z__namespace = /*#__PURE__*/_interopNamespaceDefault(z);

class EmailRouteValidator {
    get sendEmailInput() {
        return z__namespace.object({
            from: z__namespace.string().optional(),
            to: z__namespace.string(),
            cc: z__namespace.string().optional(),
            bcc: z__namespace.string().optional(),
            replyTo: z__namespace.string().optional(),
            subject: z__namespace.string(),
            text: z__namespace.string(),
            html: z__namespace.string().optional()
        }).catchall(z__namespace.string());
    }
    get emailResponse() {
        return z__namespace.object({});
    }
    constructor(strapi){
        this._strapi = strapi;
    }
}

exports.EmailRouteValidator = EmailRouteValidator;
//# sourceMappingURL=email.js.map
