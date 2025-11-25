import * as React from 'react';
import { DeleteReleaseAction, ReleaseAction } from '../../../shared/contracts/release-actions';
import { Release } from '../../../shared/contracts/releases';
interface DeleteReleaseActionItemProps {
    releaseId: DeleteReleaseAction.Request['params']['releaseId'];
    actionId: DeleteReleaseAction.Request['params']['actionId'];
}
interface ReleaseActionEntryLinkItemProps {
    contentTypeUid: ReleaseAction['contentType'];
    documentId: ReleaseAction['entry']['documentId'];
    locale: ReleaseAction['locale'];
}
interface EditReleaseItemProps {
    releaseId: Release['id'];
}
interface RootProps {
    children: React.ReactNode;
    hasTriggerBorder?: boolean;
}
export declare const ReleaseActionMenu: {
    Root: ({ children }: RootProps) => import("react/jsx-runtime").JSX.Element | null;
    EditReleaseItem: ({ releaseId }: EditReleaseItemProps) => import("react/jsx-runtime").JSX.Element;
    DeleteReleaseActionItem: ({ releaseId, actionId }: DeleteReleaseActionItemProps) => import("react/jsx-runtime").JSX.Element | null;
    ReleaseActionEntryLinkItem: ({ contentTypeUid, documentId, locale, }: ReleaseActionEntryLinkItemProps) => import("react/jsx-runtime").JSX.Element | null;
};
export {};
