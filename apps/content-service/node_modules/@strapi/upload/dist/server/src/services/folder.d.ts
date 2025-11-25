import type { Folder } from '../types';
type FolderNode = Partial<Folder> & {
    children: FolderNode[];
};
declare const _default: {
    create: (folderData: Pick<Folder, "name" | "parent">, opts?: {
        user: {
            id: string | number;
        };
    } | undefined) => Promise<any>;
    exists: (params?: {}) => Promise<boolean>;
    deleteByIds: (ids?: never[]) => Promise<{
        folders: any[];
        totalFolderNumber: number;
        totalFileNumber: number;
    }>;
    update: (id: number, { name, parent, }: {
        name: string;
        parent: number | null;
    }, { user }: {
        user: {
            id: string | number;
        };
    }) => Promise<any>;
    setPathIdAndPath: (folder: Pick<Folder, "parent">) => Promise<Pick<Folder, "parent"> & {
        pathId: number;
        path: string;
    }>;
    getStructure: () => Promise<number[] & FolderNode[]>;
};
export default _default;
//# sourceMappingURL=folder.d.ts.map