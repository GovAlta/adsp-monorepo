'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var useDocument = require('./useDocument.js');
var RelationModal = require('../pages/EditView/components/FormInputs/Relations/RelationModal.js');
var api = require('../utils/api.js');

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

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

function useDocumentContext(consumerName) {
    // Try to get state from the relation modal context first
    const currentRelationDocumentMeta = RelationModal.useRelationModal(consumerName, (state)=>state.currentDocumentMeta, false);
    const currentRelationDocument = RelationModal.useRelationModal(consumerName, (state)=>state.currentDocument, false);
    // Then try to get the same state from the URL
    const { collectionType, model, id: documentId } = useDocument.useDoc();
    const [{ query }] = strapiAdmin.useQueryParams();
    // TODO: look into why we never seem to pass any params
    const params = React__namespace.useMemo(()=>api.buildValidParams(query ?? {}), [
        query
    ]);
    const urlDocumentMeta = {
        collectionType,
        model,
        documentId: documentId,
        params
    };
    const urlDocument = useDocument.useDocument(urlDocumentMeta);
    /**
   * If there's modal state, use it in priority as it's the most specific
   * Fallback to the state derived from the URL, which is the default behavior,
   * used for the edit view, history and preview.
   */ return {
        currentDocumentMeta: currentRelationDocumentMeta ?? urlDocumentMeta,
        currentDocument: currentRelationDocument ?? urlDocument
    };
}

exports.useDocumentContext = useDocumentContext;
//# sourceMappingURL=useDocumentContext.js.map
