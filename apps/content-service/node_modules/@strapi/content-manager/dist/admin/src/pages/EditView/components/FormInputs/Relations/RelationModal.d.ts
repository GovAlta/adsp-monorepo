import * as React from 'react';
import { type UseDocument } from '../../../../../hooks/useDocument';
import { type DocumentMeta } from '../../../../../hooks/useDocumentContext';
export declare function getCollectionType(url: string): string | undefined;
interface State {
    documentHistory: DocumentMeta[];
    confirmDialogIntent: null | 'close' | 'back' | 'navigate' | DocumentMeta;
    isModalOpen: boolean;
    hasUnsavedChanges: boolean;
    fieldToConnect?: string;
    fieldToConnectUID?: string;
}
type Action = {
    type: 'GO_TO_RELATION';
    payload: {
        document: DocumentMeta;
        shouldBypassConfirmation: boolean;
        fieldToConnect?: string;
        fieldToConnectUID?: string;
    };
} | {
    type: 'GO_BACK';
    payload: {
        shouldBypassConfirmation: boolean;
    };
} | {
    type: 'GO_FULL_PAGE';
} | {
    type: 'GO_TO_CREATED_RELATION';
    payload: {
        document: DocumentMeta;
        shouldBypassConfirmation: boolean;
        fieldToConnect?: string;
        fieldToConnectUID?: string;
    };
} | {
    type: 'CANCEL_CONFIRM_DIALOG';
} | {
    type: 'CLOSE_MODAL';
    payload: {
        shouldBypassConfirmation: boolean;
    };
} | {
    type: 'SET_HAS_UNSAVED_CHANGES';
    payload: {
        hasUnsavedChanges: boolean;
    };
};
declare function reducer(state: State, action: Action): State;
interface RelationModalContextValue {
    state: State;
    dispatch: React.Dispatch<Action>;
    rootDocumentMeta: DocumentMeta;
    currentDocumentMeta: DocumentMeta;
    currentDocument: ReturnType<UseDocument>;
    onPreview?: () => void;
    isCreating: boolean;
}
declare const useRelationModal: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: RelationModalContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
type RelationModalRendererProps = {
    relation: DocumentMeta;
    children: React.ReactNode;
} | {
    relation?: never;
    children: (props: {
        dispatch: (action: Action) => void;
    }) => React.ReactNode;
};
/**
 * Component responsible for rendering its children wrapped in a modal, form and context if needed
 */
declare const RelationModalRenderer: (props: RelationModalRendererProps) => import("react/jsx-runtime").JSX.Element;
export { reducer, RelationModalRenderer, useRelationModal };
export type { State, Action };
