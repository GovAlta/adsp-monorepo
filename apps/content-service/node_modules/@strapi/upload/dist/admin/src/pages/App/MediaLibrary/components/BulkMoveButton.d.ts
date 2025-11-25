import type { File } from '../../../../../../shared/contracts/files';
import type { Folder as FolderDefinition } from '../../../../../../shared/contracts/folders';
interface FolderWithType extends FolderDefinition {
    type: string;
}
interface FileWithType extends File {
    type: string;
}
export interface BulkMoveButtonProps {
    onSuccess: () => void;
    currentFolder?: FolderWithType;
    selected?: Array<FolderWithType | FileWithType>;
}
export declare const BulkMoveButton: ({ selected, onSuccess, currentFolder, }: BulkMoveButtonProps) => import("react/jsx-runtime").JSX.Element;
export {};
