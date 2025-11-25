import { FolderNode } from '../../../shared/contracts/folders';
interface FolderNodeWithChildren extends Omit<FolderNode, 'children'> {
    children: FolderNodeWithChildren[];
    label?: string;
    value: string | number | null;
}
export declare const useFolderStructure: ({ enabled }?: {
    enabled?: boolean | undefined;
}) => {
    data: {
        value: null;
        label: string;
        children: import("./utils/renameKeys").DeepRecord<FolderNodeWithChildren>[];
    }[] | undefined;
    error: unknown;
    isLoading: boolean;
};
export {};
