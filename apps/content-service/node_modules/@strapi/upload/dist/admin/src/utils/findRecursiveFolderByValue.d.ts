import type { FolderNode } from '../../../shared/contracts/folders';
interface FolderStructureValue extends Omit<FolderNode, 'children'> {
    value?: string | number | null;
    children?: FolderStructureValue[];
    label?: string;
}
type Value = number | null | {
    value: number | null;
};
export declare function findRecursiveFolderByValue(data: FolderStructureValue[], value: Value): FolderStructureValue | undefined;
export {};
