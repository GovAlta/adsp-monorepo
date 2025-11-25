import type { File } from '../../../../../../shared/contracts/files';
import type { FolderDefinition, Folder as FolderInitial } from '../../../../../../shared/contracts/folders';
interface FolderWithType extends FolderInitial {
    type: string;
}
export interface FileWithType extends File {
    type: string;
}
export interface BulkActionsProps {
    selected: Array<FileWithType | FolderDefinition> | Array<FolderWithType | FileWithType>;
    onSuccess: () => void;
    currentFolder?: FolderWithType;
}
export declare const BulkActions: ({ selected, onSuccess, currentFolder }: BulkActionsProps) => import("react/jsx-runtime").JSX.Element;
export {};
