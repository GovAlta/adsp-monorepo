import { File } from '../../../../shared/contracts/files';
import type { Folder } from '../../../../shared/contracts/folders';
interface FolderWithType extends Folder {
    type: string;
}
interface FileWithType extends File {
    type: string;
}
export interface BulkMoveDialogProps {
    onClose: () => void;
    selected?: Array<FolderWithType | FileWithType>;
    currentFolder?: FolderWithType;
}
export declare const BulkMoveDialog: ({ onClose, selected, currentFolder }: BulkMoveDialogProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
