import { FolderRow, FileRow } from '../../TableList/TableList';
import type { File, Query, FilterCondition } from '../../../../../shared/contracts/files';
import type { Folder } from '../../../../../shared/contracts/folders';
import type { AllowedTypes } from '../../AssetCard/AssetCard';
type NumberKeyedObject = Record<number, string>;
type StringFilter = {
    [key: string]: string;
};
type MimeFilter = {
    [key: string]: string | NumberKeyedObject | Record<string, string | NumberKeyedObject> | undefined;
};
export type FilterStructure = {
    [key: string]: MimeFilter | StringFilter | undefined;
};
export type Filter = {
    [key in 'mime' | 'createdAt' | 'updatedAt']?: {
        [key in '$contains' | '$notContains' | '$eq' | '$not']?: string[] | string | {
            $contains: string[];
        };
    } | undefined;
};
export interface FolderWithType extends Omit<Folder, 'children' | 'files'> {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
    children?: Folder['children'] & {
        count: number;
    };
    files?: Folder['files'] & {
        count: number;
    };
}
export interface FileWithType extends File {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
}
export interface BrowseStepProps {
    allowedTypes?: AllowedTypes[];
    assets: File[];
    canCreate: boolean;
    canRead: boolean;
    folders?: FolderWithType[];
    multiple?: boolean;
    onAddAsset: () => void;
    onChangeFilters: (filters: FilterCondition<string>[] | Filter[]) => void;
    onChangeFolder: (id: number, path?: string) => void;
    onChangePage: (page: number) => void;
    onChangePageSize: (value: number) => void;
    onChangeSort: (value: Query['sort'] | string) => void;
    onChangeSearch: (_q?: Query['_q'] | null) => void;
    onEditAsset: ((asset: FileWithType) => void) | null;
    onEditFolder: ((folder: FolderRow) => void) | null;
    onSelectAsset: (element: FileRow | FolderRow) => void;
    onSelectAllAsset?: (checked: boolean | string, rows?: FolderRow[] | FileRow[]) => void;
    queryObject: Query;
    pagination: {
        pageCount: number;
    };
    selectedAssets: FileWithType[] | FolderWithType[];
}
export declare const BrowseStep: ({ allowedTypes, assets: rawAssets, canCreate, canRead, folders, multiple, onAddAsset, onChangeFilters, onChangePage, onChangePageSize, onChangeSearch, onChangeSort, onChangeFolder, onEditAsset, onEditFolder, onSelectAllAsset, onSelectAsset, pagination, queryObject, selectedAssets, }: BrowseStepProps) => import("react/jsx-runtime").JSX.Element;
export {};
