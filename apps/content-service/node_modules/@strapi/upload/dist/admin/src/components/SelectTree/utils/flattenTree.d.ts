type TreeNode<T> = {
    value: T;
    children?: TreeNode<T>[];
    label?: string;
};
export type FlattenedNode<T> = {
    value: T;
    parent?: T;
    depth: number;
    label?: string;
    children?: TreeNode<T>[];
};
export declare function flattenTree<T>(tree: TreeNode<T>[], parent?: TreeNode<T> | null, depth?: number): FlattenedNode<T>[];
export {};
