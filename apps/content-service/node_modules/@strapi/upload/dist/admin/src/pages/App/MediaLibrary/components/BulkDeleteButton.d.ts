import type { FolderDefinition } from '../../../../../../shared/contracts/folders';
import type { FileWithType } from '../../../../hooks/useBulkRemove';
export interface BulkDeleteButtonProps {
    selected: Array<FileWithType | FolderDefinition>;
    onSuccess: () => void;
}
export declare const BulkDeleteButton: ({ selected, onSuccess }: BulkDeleteButtonProps) => import("react/jsx-runtime").JSX.Element;
