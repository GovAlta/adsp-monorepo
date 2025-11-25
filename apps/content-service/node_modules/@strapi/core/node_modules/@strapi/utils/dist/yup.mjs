import * as yup from 'yup';
export * from 'yup';
import ___default from 'lodash';
import { get, isNumber, isInteger } from 'lodash/fp';
import { isCamelCase, isKebabCase } from './primitives/strings.mjs';
import { printValue } from './print-value.mjs';

const strapiID = ()=>new StrapiIDSchema();
const isNotNilTest = (value)=>!___default.isNil(value);
const isNotNullTest = (value)=>!___default.isNull(value);
yup.addMethod(yup.mixed, 'notNil', function isNotNill(msg = '${path} must be defined.') {
    return this.test('defined', msg, isNotNilTest);
});
yup.addMethod(yup.mixed, 'notNull', function isNotNull(msg = '${path} cannot be null.') {
    return this.test('defined', msg, isNotNullTest);
});
yup.addMethod(yup.mixed, 'isFunction', function isFunction(message = '${path} is not a function') {
    return this.test('is a function', message, (value)=>___default.isUndefined(value) || ___default.isFunction(value));
});
yup.addMethod(yup.string, 'isCamelCase', function isCamelCase$1(message = '${path} is not in camel case (anExampleOfCamelCase)') {
    return this.test('is in camelCase', message, (value)=>value ? isCamelCase(value) : true);
});
yup.addMethod(yup.string, 'isKebabCase', function isKebabCase$1(message = '${path} is not in kebab case (an-example-of-kebab-case)') {
    return this.test('is in kebab-case', message, (value)=>value ? isKebabCase(value) : true);
});
yup.addMethod(yup.object, 'onlyContainsFunctions', function onlyContainsFunctions(message = '${path} contains values that are not functions') {
    return this.test('only contains functions', message, (value)=>___default.isUndefined(value) || value && Object.values(value).every(___default.isFunction));
});
yup.addMethod(yup.array, 'uniqueProperty', function uniqueProperty(propertyName, message) {
    return this.test('unique', message, function unique(list) {
        const errors = [];
        list?.forEach((element, index)=>{
            const sameElements = list.filter((e)=>get(propertyName, e) === get(propertyName, element));
            if (sameElements.length > 1) {
                errors.push(this.createError({
                    path: `${this.path}[${index}].${propertyName}`,
                    message
                }));
            }
        });
        if (errors.length) {
            throw new yup.ValidationError(errors);
        }
        return true;
    });
});
class StrapiIDSchema extends yup.MixedSchema {
    _typeCheck(value) {
        return typeof value === 'string' || isNumber(value) && isInteger(value) && value >= 0;
    }
    constructor(){
        super({
            type: 'strapiID'
        });
    }
}
// Temporary fix of this issue : https://github.com/jquense/yup/issues/616
yup.setLocale({
    mixed: {
        notType (options) {
            const { path, type, value, originalValue } = options;
            const isCast = originalValue != null && originalValue !== value;
            const msg = `${path} must be a \`${type}\` type, ` + `but the final value was: \`${printValue(value, true)}\`${isCast ? ` (cast from the value \`${printValue(originalValue, true)}\`).` : '.'}`;
            /* Remove comment that is not supposed to be seen by the enduser
      if (value === null) {
        msg += `\n If "null" is intended as an empty value be sure to mark the schema as \`.nullable()\``;
      }
      */ return msg;
        }
    }
});

export { StrapiIDSchema, strapiID };
//# sourceMappingURL=yup.mjs.map
