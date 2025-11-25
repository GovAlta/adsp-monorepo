import * as React from 'react';
import { type Permission } from '@strapi/admin/strapi-admin';
import type { Schema } from '@strapi/types';
/**
 * The boolean values indicate the global actions a user can perform on the document.
 * The `string[]` values tell us specifically which fields the actions can be performed on,
 * for example, if the `canReadFields` array is empty, than no fields can be read by the user.
 * This can happen even if the user can read the document.
 */
interface DocumentRBACContextValue {
    canCreate?: boolean;
    canCreateFields: string[];
    canDelete?: boolean;
    canPublish?: boolean;
    canRead?: boolean;
    canReadFields: string[];
    canUpdate?: boolean;
    canUpdateFields: string[];
    canUserAction: (fieldName: string, fieldsUserCanAction: string[], fieldType: Schema.Attribute.Kind) => boolean;
    isLoading: boolean;
}
declare const useDocumentRBAC: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: DocumentRBACContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
interface DocumentRBACProps {
    children: React.ReactNode;
    permissions: Permission[] | null;
    model?: string;
}
/**
 * @internal This component is not meant to be used outside of the Content Manager plugin.
 * It depends on knowing the slug/model of the content-type using the params of the URL or the model if it is passed as arg.
 * If you do use the hook outside of the context, we default to `false` for all actions.
 *
 * It then creates an list of `can{Action}` that are passed to the context for consumption
 * within the app to enforce RBAC.
 */
declare const DocumentRBAC: ({ children, permissions, model }: DocumentRBACProps) => import("react/jsx-runtime").JSX.Element;
export { DocumentRBAC, useDocumentRBAC, DocumentRBACContextValue, DocumentRBACProps };
