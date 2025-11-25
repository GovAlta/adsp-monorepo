'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var fp = require('lodash/fp');
var yup = require('yup');
var getTrad = require('../../../utils/getTrad.js');
var createUid = require('../utils/createUid.js');

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

const CATEGORY_NAME_REGEX = /^[A-Za-z][-_0-9A-Za-z]*$/;
const createComponentSchema = (usedComponentNames, reservedNames, category, takenCollectionNames, currentCollectionName)=>{
    const shape = {
        displayName: yup__namespace.string().test({
            name: 'nameAlreadyUsed',
            message: strapiAdmin.translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const name = createUid.createComponentUid(value, category);
                const snakeCaseKey = fp.snakeCase(name);
                const snakeCaseCollectionName = fp.snakeCase(currentCollectionName);
                return usedComponentNames.every((reserved)=>{
                    return fp.snakeCase(reserved) !== snakeCaseKey;
                }) && takenCollectionNames.every((collectionName)=>fp.snakeCase(collectionName) !== snakeCaseCollectionName);
            }
        }).test({
            name: 'nameNotAllowed',
            message: getTrad.getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return reservedNames.every((reserved)=>{
                    return fp.snakeCase(reserved) !== snakeCaseKey;
                });
            }
        }).required(strapiAdmin.translatedErrors.required.id),
        category: yup__namespace.string().matches(CATEGORY_NAME_REGEX, strapiAdmin.translatedErrors.regex.id).required(strapiAdmin.translatedErrors.required.id),
        icon: yup__namespace.string()
    };
    return yup__namespace.object(shape);
};

exports.createComponentSchema = createComponentSchema;
//# sourceMappingURL=createComponentSchema.js.map
