import { type UseDocument } from '../hooks/useDocument';
interface DocumentMeta {
    /**
     * The equivalent of the ":id" url param value
     * i.e. gus5a67jcboa3o2zjnz39mb1
     */
    documentId?: string;
    /**
     * The equivalent of the url ":slug" param value
     * i.e. api::articles.article
     */
    model: string;
    /**
     * The equivalent of the url ":collectionType" param value
     * i.e. collection-types or single-types
     */
    collectionType: string;
    /**
     * Query params object
     * i.e. { locale: 'fr' }
     */
    params?: Record<string, string | string[] | null>;
}
interface DocumentContextValue {
    currentDocumentMeta: DocumentMeta;
    currentDocument: ReturnType<UseDocument>;
}
declare function useDocumentContext(consumerName: string): DocumentContextValue;
export { useDocumentContext };
export type { DocumentMeta };
