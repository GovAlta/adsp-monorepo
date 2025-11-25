import type { File } from '../../../../../shared/contracts/files';
import type { FolderDefinition } from '../../../../../shared/contracts/folders';
export interface FileWithType extends File {
    type: string;
}
export interface BulkDeleteButtonProps {
    selected: Array<FileWithType | FolderDefinition>;
    onSuccess: () => void;
}
export declare const BulkDeleteButton: ({ selected, onSuccess }: BulkDeleteButtonProps) => import("react/jsx-runtime").JSX.Element;
