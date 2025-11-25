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

const createContentTypeSchema = ({ usedContentTypeNames = [], reservedModels = [], singularNames = [], pluralNames = [], collectionNames = [] })=>{
    const shape = {
        displayName: yup__namespace.string().test({
            name: 'nameAlreadyUsed',
            message: strapiAdmin.translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const name = createUid.createUid(value);
                const snakeCaseKey = fp.snakeCase(name);
                return !usedContentTypeNames.some((value)=>{
                    return fp.snakeCase(value) === snakeCaseKey;
                });
            }
        }).test({
            name: 'nameNotAllowed',
            message: getTrad.getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !reservedModels.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).required(strapiAdmin.translatedErrors.required.id),
        pluralName: yup__namespace.string().test({
            name: 'pluralNameAlreadyUsed',
            message: strapiAdmin.translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !pluralNames.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralNameAlreadyUsedAsSingular',
            message: getTrad.getTrad('error.contentType.pluralName-equals-singularName'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !singularNames.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralAndSingularAreUnique',
            message: getTrad.getTrad('error.contentType.pluralName-used'),
            test (value, context) {
                if (!value) {
                    return false;
                }
                return fp.snakeCase(context.parent.singularName) !== fp.snakeCase(value);
            }
        }).test({
            name: 'pluralNameNotAllowed',
            message: getTrad.getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !reservedModels.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralNameNotAlreadyUsedInCollectionName',
            message: getTrad.getTrad('error.contentType.pluralName-equals-collectionName'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !collectionNames.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).required(strapiAdmin.translatedErrors.required.id),
        singularName: yup__namespace.string().test({
            name: 'singularNameAlreadyUsed',
            message: strapiAdmin.translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !singularNames.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'singularNameAlreadyUsedAsPlural',
            message: getTrad.getTrad('error.contentType.singularName-equals-pluralName'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !pluralNames.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralAndSingularAreUnique',
            message: getTrad.getTrad('error.contentType.singularName-used'),
            test (value, context) {
                if (!value) {
                    return false;
                }
                return fp.snakeCase(context.parent.pluralName) !== fp.snakeCase(value);
            }
        }).test({
            name: 'singularNameNotAllowed',
            message: getTrad.getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = fp.snakeCase(value);
                return !reservedModels.some((key)=>{
                    return fp.snakeCase(key) === snakeCaseKey;
                });
            }
        }).required(strapiAdmin.translatedErrors.required.id),
        draftAndPublish: yup__namespace.boolean(),
        kind: yup__namespace.string().oneOf([
            'singleType',
            'collectionType'
        ])
    };
    return yup__namespace.object(shape);
};

exports.createContentTypeSchema = createContentTypeSchema;
//# sourceMappingURL=createContentTypeSchema.js.map
