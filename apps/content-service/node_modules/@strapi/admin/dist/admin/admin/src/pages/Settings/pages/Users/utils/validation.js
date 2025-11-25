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

/**
 * @description This needs wrapping in `yup.object().shape()` before use.
 */ const COMMON_USER_SCHEMA = {
    firstname: yup__namespace.string().trim().required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'This field is required'
    }),
    lastname: yup__namespace.string().nullable(),
    email: yup__namespace.string().email(translatedErrors.translatedErrors.email).lowercase().required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'This field is required'
    }),
    username: yup__namespace.string().transform((value)=>value === '' ? undefined : value).nullable(),
    password: yup__namespace.string().transform((value)=>value === '' || value === null ? undefined : value).nullable().min(8, {
        ...translatedErrors.translatedErrors.minLength,
        values: {
            min: 8
        }
    }).test('max-bytes', {
        id: 'components.Input.error.contain.maxBytes',
        defaultMessage: 'Password must be less than 73 bytes'
    }, function(value) {
        if (!value) return true;
        return new TextEncoder().encode(value).length <= 72;
    }).matches(/[a-z]/, {
        id: 'components.Input.error.contain.lowercase',
        defaultMessage: 'Password must contain at least one lowercase character'
    }).matches(/[A-Z]/, {
        id: 'components.Input.error.contain.uppercase',
        defaultMessage: 'Password must contain at least one uppercase character'
    }).matches(/\d/, {
        id: 'components.Input.error.contain.number',
        defaultMessage: 'Password must contain at least one number'
    }),
    confirmPassword: yup__namespace.string().transform((value)=>value === '' ? null : value).nullable().min(8, {
        ...translatedErrors.translatedErrors.minLength,
        values: {
            min: 8
        }
    }).oneOf([
        yup__namespace.ref('password'),
        null
    ], {
        id: 'components.Input.error.password.noMatch',
        defaultMessage: 'Passwords must match'
    }).when('password', (password, passSchema)=>{
        return password ? passSchema.required({
            id: translatedErrors.translatedErrors.required.id,
            defaultMessage: 'This field is required'
        }).nullable() : passSchema;
    })
};

exports.COMMON_USER_SCHEMA = COMMON_USER_SCHEMA;
//# sourceMappingURL=validation.js.map
