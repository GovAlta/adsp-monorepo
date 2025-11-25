'use strict';

var yup = require('yup');
var fp = require('lodash/fp');
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

const getPreviewUrlSchema = yup__namespace.object().shape({
    // Will be undefined for single types
    documentId: yup__namespace.string(),
    locale: yup__namespace.string().nullable(),
    status: yup__namespace.string()
}).required();
const validatePreviewUrl = async (strapi, uid, params)=>{
    // Validate the request parameters format
    await strapiUtils.validateYupSchema(getPreviewUrlSchema)(params);
    const newParams = fp.pick([
        'documentId',
        'locale',
        'status'
    ], params);
    const model = strapi.getModel(uid);
    // If it's not a collection type or single type
    if (!model || model.modelType !== 'contentType') {
        throw new strapiUtils.errors.ValidationError('Invalid content type');
    }
    // Document id is not required for single types
    const isSingleType = model?.kind === 'singleType';
    if (!isSingleType && !params.documentId) {
        throw new strapiUtils.errors.ValidationError('documentId is required for Collection Types');
    }
    // Fill the documentId if it's a single type
    if (isSingleType) {
        const doc = await strapi.documents(uid).findFirst();
        if (!doc) {
            throw new strapiUtils.errors.NotFoundError('Document not found');
        }
        newParams.documentId = doc?.documentId;
    }
    /**
   * If status is not specified, follow the following rules:
   * - D&P disabled: status is considered published
   * - D&P enabled: status is considered draft
   */ if (!newParams.status) {
        const isDPEnabled = model?.options?.draftAndPublish;
        newParams.status = isDPEnabled ? 'draft' : 'published';
    }
    return newParams;
};

exports.validatePreviewUrl = validatePreviewUrl;
//# sourceMappingURL=preview.js.map
