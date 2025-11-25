import * as React from 'react';
import type { File } from '../../../../shared/contracts/files';
interface AIUploadModalProps {
    open: boolean;
    onClose: () => void;
    folderId?: number | null;
}
type State = {
    uploadedAssets: Array<{
        file: File;
        wasCaptionChanged: boolean;
        wasAltTextChanged: boolean;
    }>;
    assetsToUploadLength: number;
    hasUnsavedChanges: boolean;
};
type Action = {
    type: 'set_uploaded_assets';
    payload: File[];
} | {
    type: 'set_assets_to_upload_length';
    payload: number;
} | {
    type: 'set_uploaded_asset_caption';
    payload: {
        id: number;
        caption: string;
    };
} | {
    type: 'set_uploaded_asset_alt_text';
    payload: {
        id: number;
        altText: string;
    };
} | {
    type: 'remove_uploaded_asset';
    payload: {
        id: number;
    };
} | {
    type: 'edit_uploaded_asset';
    payload: {
        editedAsset: File;
    };
} | {
    type: 'clear_unsaved_changes';
};
declare const useAIUploadModalContext: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: {
    state: State;
    dispatch: React.Dispatch<Action>;
    folderId: number | null;
    onClose: () => void;
}) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
export declare const AIUploadModal: ({ open, onClose, folderId }: AIUploadModalProps) => import("react/jsx-runtime").JSX.Element;
export { useAIUploadModalContext };
