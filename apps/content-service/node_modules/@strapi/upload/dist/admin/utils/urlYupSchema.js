'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var yup = require('yup');
var getTrad = require('./getTrad.js');

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

const urlSchema = yup__namespace.object().shape({
    urls: yup__namespace.string().test({
        name: 'isUrlValid',
        // eslint-disable-next-line no-template-curly-in-string
        message: '${path}',
        test (values = '') {
            const urls = values.split(/\r?\n/);
            if (urls.length === 0) {
                return this.createError({
                    path: this.path,
                    message: strapiAdmin.translatedErrors.min.id
                });
            }
            if (urls.length > 20) {
                return this.createError({
                    path: this.path,
                    message: strapiAdmin.translatedErrors.max.id
                });
            }
            const filtered = urls.filter((val)=>{
                try {
                    // eslint-disable-next-line no-new
                    new URL(val);
                    return false;
                } catch (err) {
                    // invalid url
                    return true;
                }
            });
            const filteredLength = filtered.length;
            if (filteredLength === 0) {
                return true;
            }
            const errorMessage = filteredLength > 1 ? 'form.upload-url.error.url.invalids' : 'form.upload-url.error.url.invalid';
            return this.createError({
                path: this.path,
                message: getTrad.getTrad(errorMessage),
                params: {
                    number: filtered.length
                }
            });
        }
    })
});

exports.urlSchema = urlSchema;
//# sourceMappingURL=urlYupSchema.js.map
