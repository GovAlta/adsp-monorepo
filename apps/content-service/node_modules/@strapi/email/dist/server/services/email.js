'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');

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

var ___namespace = /*#__PURE__*/_interopNamespaceDefault(_);

const { createStrictInterpolationRegExp } = utils.template;
const getProviderSettings = ()=>strapi.config.get('plugin::email');
const send = async (options)=>strapi.plugin('email').provider.send(options);
/**
 * fill subject, text and html using lodash template
 * @param {object} emailOptions - to, from and replyto...
 * @param {object} emailTemplate - object containing attributes to fill
 * @param {object} data - data used to fill the template
 * @returns {{ subject, text, subject }}
 */ const sendTemplatedEmail = (emailOptions, emailTemplate, data)=>{
    const attributes = [
        'subject',
        'text',
        'html'
    ];
    const missingAttributes = ___namespace.difference(attributes, Object.keys(emailTemplate));
    if (missingAttributes.length > 0) {
        throw new Error(`Following attributes are missing from your email template : ${missingAttributes.join(', ')}`);
    }
    const allowedInterpolationVariables = utils.objects.keysDeep(data);
    const interpolate = createStrictInterpolationRegExp(allowedInterpolationVariables, 'g');
    const templatedAttributes = attributes.reduce((compiled, attribute)=>emailTemplate[attribute] ? Object.assign(compiled, {
            [attribute]: ___namespace.template(emailTemplate[attribute], {
                interpolate
            })(data)
        }) : compiled, {});
    return strapi.plugin('email').provider.send({
        ...emailOptions,
        ...templatedAttributes
    });
};
const emailService = ()=>({
        getProviderSettings,
        send,
        sendTemplatedEmail
    });

module.exports = emailService;
//# sourceMappingURL=email.js.map
