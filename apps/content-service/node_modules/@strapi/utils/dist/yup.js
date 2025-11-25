'use strict';

var yup = require('yup');
var _ = require('lodash');
var fp = require('lodash/fp');
var strings = require('./primitives/strings.js');
var printValue = require('./print-value.js');

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

const strapiID = ()=>new StrapiIDSchema();
const isNotNilTest = (value)=>!_.isNil(value);
const isNotNullTest = (value)=>!_.isNull(value);
yup__namespace.addMethod(yup__namespace.mixed, 'notNil', function isNotNill(msg = '${path} must be defined.') {
    return this.test('defined', msg, isNotNilTest);
});
yup__namespace.addMethod(yup__namespace.mixed, 'notNull', function isNotNull(msg = '${path} cannot be null.') {
    return this.test('defined', msg, isNotNullTest);
});
yup__namespace.addMethod(yup__namespace.mixed, 'isFunction', function isFunction(message = '${path} is not a function') {
    return this.test('is a function', message, (value)=>_.isUndefined(value) || _.isFunction(value));
});
yup__namespace.addMethod(yup__namespace.string, 'isCamelCase', function isCamelCase(message = '${path} is not in camel case (anExampleOfCamelCase)') {
    return this.test('is in camelCase', message, (value)=>value ? strings.isCamelCase(value) : true);
});
yup__namespace.addMethod(yup__namespace.string, 'isKebabCase', function isKebabCase(message = '${path} is not in kebab case (an-example-of-kebab-case)') {
    return this.test('is in kebab-case', message, (value)=>value ? strings.isKebabCase(value) : true);
});
yup__namespace.addMethod(yup__namespace.object, 'onlyContainsFunctions', function onlyContainsFunctions(message = '${path} contains values that are not functions') {
    return this.test('only contains functions', message, (value)=>_.isUndefined(value) || value && Object.values(value).every(_.isFunction));
});
yup__namespace.addMethod(yup__namespace.array, 'uniqueProperty', function uniqueProperty(propertyName, message) {
    return this.test('unique', message, function unique(list) {
        const errors = [];
        list?.forEach((element, index)=>{
            const sameElements = list.filter((e)=>fp.get(propertyName, e) === fp.get(propertyName, element));
            if (sameElements.length > 1) {
                errors.push(this.createError({
                    path: `${this.path}[${index}].${propertyName}`,
                    message
                }));
            }
        });
        if (errors.length) {
            throw new yup__namespace.ValidationError(errors);
        }
        return true;
    });
});
class StrapiIDSchema extends yup__namespace.MixedSchema {
    _typeCheck(value) {
        return typeof value === 'string' || fp.isNumber(value) && fp.isInteger(value) && value >= 0;
    }
    constructor(){
        super({
            type: 'strapiID'
        });
    }
}
// Temporary fix of this issue : https://github.com/jquense/yup/issues/616
yup__namespace.setLocale({
    mixed: {
        notType (options) {
            const { path, type, value, originalValue } = options;
            const isCast = originalValue != null && originalValue !== value;
            const msg = `${path} must be a \`${type}\` type, ` + `but the final value was: \`${printValue.printValue(value, true)}\`${isCast ? ` (cast from the value \`${printValue.printValue(originalValue, true)}\`).` : '.'}`;
            /* Remove comment that is not supposed to be seen by the enduser
      if (value === null) {
        msg += `\n If "null" is intended as an empty value be sure to mark the schema as \`.nullable()\``;
      }
      */ return msg;
        }
    }
});

exports.StrapiIDSchema = StrapiIDSchema;
exports.strapiID = strapiID;
Object.keys(yup).forEach(function (k) {
  if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () { return yup[k]; }
  });
});
//# sourceMappingURL=yup.js.map
