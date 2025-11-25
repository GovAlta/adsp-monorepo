import { SerializedError } from '@reduxjs/toolkit';
import { type TrackingEvent } from '@strapi/admin/strapi-admin';
import { BaseQueryError } from '../utils/api';
import type { Document } from './useDocument';
import type { AutoClone, Clone, Create, Delete, BulkDelete, Discard, FindOne, Publish, BulkPublish, Update, Unpublish, BulkUnpublish } from '../../../shared/contracts/collection-types';
type OperationResponse<TResponse extends {
    data: any;
    meta?: any;
    error?: any;
}> = Pick<TResponse, 'data'> | Pick<TResponse, 'data' | 'meta'> | {
    error: BaseQueryError | SerializedError;
};
type BulkOperationResponse<TResponse extends {
    data: any;
    error?: any;
}> = Pick<TResponse, 'data'> | {
    error: BaseQueryError | SerializedError;
};
type UseDocumentActions = (fromPreview?: boolean, fromRelationModal?: boolean) => {
    /**
     * @description Attempts to clone a document based on the provided sourceId.
     * This will return a list of the fields as an error if it's unable to clone.
     * You most likely want to use the `clone` action instead.
     */
    isLoading: boolean;
    autoClone: (args: {
        model: string;
        sourceId: string;
        locale?: string;
    }) => Promise<OperationResponse<AutoClone.Response>>;
    clone: (args: {
        model: string;
        documentId: string;
        params?: object;
    }, document: Omit<Document, 'id'>, trackerProperty?: Extract<TrackingEvent, {
        name: 'willCreateEntry' | 'didCreateEntry' | 'didNotCreateEntry';
    }>['properties']) => Promise<OperationResponse<Clone.Response>>;
    create: (args: {
        model: string;
        params?: object;
    }, document: Omit<Document, 'id'>, trackerProperty?: Extract<TrackingEvent, {
        name: 'willCreateEntry' | 'didCreateEntry' | 'didNotCreateEntry';
    }>['properties']) => Promise<OperationResponse<Create.Response>>;
    delete: (args: {
        collectionType: string;
        model: string;
        documentId?: string;
        params?: object;
    }, trackerProperty?: Extract<TrackingEvent, {
        name: 'willDeleteEntry' | 'didDeleteEntry' | 'didNotDeleteEntry';
    }>['properties']) => Promise<OperationResponse<Delete.Response>>;
    deleteMany: (args: {
        model: string;
        documentIds: string[];
        params?: object;
    }) => Promise<BulkOperationResponse<BulkDelete.Response>>;
    discard: (args: {
        collectionType: string;
        model: string;
        documentId?: string;
        params?: object;
    }) => Promise<OperationResponse<Discard.Response>>;
    getDocument: (args: {
        collectionType: string;
        model: string;
        documentId?: string;
        params?: object;
    }) => Promise<FindOne.Response | undefined>;
    publish: (args: {
        collectionType: string;
        model: string;
        documentId?: string;
        params?: object;
    }, document: Partial<Document>) => Promise<OperationResponse<Publish.Response>>;
    publishMany: (args: {
        model: string;
        documentIds: string[];
        params?: object;
    }) => Promise<BulkOperationResponse<BulkPublish.Response>>;
    update: (args: {
        collectionType: string;
        model: string;
        documentId?: string;
        params?: object;
    }, document: Partial<Document>, trackerProperty?: Extract<TrackingEvent, {
        name: 'willEditEntry' | 'didEditEntry' | 'didNotEditEntry';
    }>['properties']) => Promise<OperationResponse<Update.Response>>;
    unpublish: (args: {
        collectionType: string;
        model: string;
        documentId?: string;
        params?: object;
    }, discardDraft?: boolean) => Promise<OperationResponse<Unpublish.Response>>;
    unpublishMany: (args: {
        model: string;
        documentIds: string[];
        params?: object;
    }) => Promise<BulkOperationResponse<BulkUnpublish.Response>>;
};
/**
 * @alpha
 * @public
 * @description Contains all the operations that can be performed on a single document.
 * Designed to be able to be used anywhere within a Strapi app. The hooks will handle
 * notifications should the operation fail, however the response is always returned incase
 * the user needs to handle side-effects.
 * @example
 * ```tsx
 * import { Form } from '@strapi/admin/admin';
 *
 * const { id, model, collectionType } = useParams<{ id: string; model: string; collectionType: string }>();
 * const { update } = useDocumentActions();
 *
 * const handleSubmit = async (data) => {
 *  await update({ collectionType, model, documentId: id }, data);
 * }
 *
 * return <Form method="PUT" onSubmit={handleSubmit} />
 * ```
 *
 * @see {@link https://contributor.strapi.io/docs/core/content-manager/hooks/use-document-operations} for more information
 */
declare const useDocumentActions: UseDocumentActions;
export { useDocumentActions };
export type { UseDocumentActions, OperationResponse };
