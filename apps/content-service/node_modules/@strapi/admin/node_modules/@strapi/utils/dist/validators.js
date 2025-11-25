'use strict';

var yup = require('yup');
var fp = require('lodash/fp');
var errors = require('./errors.js');

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

const handleYupError = (error, errorMessage)=>{
    throw new errors.YupValidationError(error, errorMessage);
};
const defaultValidationParam = {
    strict: true,
    abortEarly: false
};
const validateYupSchema = (schema, options = {})=>async (body, errorMessage)=>{
        try {
            const optionsWithDefaults = fp.defaults(defaultValidationParam, options);
            const result = await schema.validate(body, optionsWithDefaults);
            return result;
        } catch (e) {
            if (e instanceof yup__namespace.ValidationError) {
                handleYupError(e, errorMessage);
            }
            throw e;
        }
    };
const validateYupSchemaSync = (schema, options = {})=>(body, errorMessage)=>{
        try {
            const optionsWithDefaults = fp.defaults(defaultValidationParam, options);
            return schema.validateSync(body, optionsWithDefaults);
        } catch (e) {
            if (e instanceof yup__namespace.ValidationError) {
                handleYupError(e, errorMessage);
            }
            throw e;
        }
    };

exports.handleYupError = handleYupError;
exports.validateYupSchema = validateYupSchema;
exports.validateYupSchemaSync = validateYupSchemaSync;
//# sourceMappingURL=validators.js.map
