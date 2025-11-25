import { type UseDocument } from '../../hooks/useDocument';
declare const EditViewPage: () => import("react/jsx-runtime").JSX.Element;
/**
 * @internal
 * @description Returns the status of the document where its latest state takes priority,
 * this typically will be "published" unless a user has edited their draft in which we should
 * display "modified".
 */
declare const getDocumentStatus: (document: ReturnType<UseDocument>['document'], meta: ReturnType<UseDocument>['meta']) => 'draft' | 'published' | 'modified';
declare const ProtectedEditViewPage: () => import("react/jsx-runtime").JSX.Element;
export { EditViewPage, ProtectedEditViewPage, getDocumentStatus };
