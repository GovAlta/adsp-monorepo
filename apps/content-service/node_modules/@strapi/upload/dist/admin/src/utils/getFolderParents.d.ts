import type { FolderNode } from '../../../shared/contracts/folders';
interface FolderStructureValue extends Omit<FolderNode, 'children'> {
    value: string | number | null;
    children?: FolderStructureValue[];
}
export declare const getFolderParents: (folders: FolderStructureValue[], currentFolderId: number) => {
    id?: string | number | null | undefined;
    label?: string | undefined;
    path?: string | undefined;
}[];
export {};
