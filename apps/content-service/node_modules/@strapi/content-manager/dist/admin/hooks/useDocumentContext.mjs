import * as React from 'react';
import { useQueryParams } from '@strapi/admin/strapi-admin';
import { useDoc, useDocument } from './useDocument.mjs';
import { useRelationModal } from '../pages/EditView/components/FormInputs/Relations/RelationModal.mjs';
import { buildValidParams } from '../utils/api.mjs';

function useDocumentContext(consumerName) {
    // Try to get state from the relation modal context first
    const currentRelationDocumentMeta = useRelationModal(consumerName, (state)=>state.currentDocumentMeta, false);
    const currentRelationDocument = useRelationModal(consumerName, (state)=>state.currentDocument, false);
    // Then try to get the same state from the URL
    const { collectionType, model, id: documentId } = useDoc();
    const [{ query }] = useQueryParams();
    // TODO: look into why we never seem to pass any params
    const params = React.useMemo(()=>buildValidParams(query ?? {}), [
        query
    ]);
    const urlDocumentMeta = {
        collectionType,
        model,
        documentId: documentId,
        params
    };
    const urlDocument = useDocument(urlDocumentMeta);
    /**
   * If there's modal state, use it in priority as it's the most specific
   * Fallback to the state derived from the URL, which is the default behavior,
   * used for the edit view, history and preview.
   */ return {
        currentDocumentMeta: currentRelationDocumentMeta ?? urlDocumentMeta,
        currentDocument: currentRelationDocument ?? urlDocument
    };
}

export { useDocumentContext };
//# sourceMappingURL=useDocumentContext.mjs.map
