import type { Folder } from '../../../shared/contracts/folders';
import type { MessageDescriptor } from 'react-intl';
export interface BreadcrumbDataFolder extends Omit<Folder, 'children' | 'files' | 'parent'> {
    parent?: BreadcrumbDataFolder;
    children?: {
        count: number;
    };
    files?: {
        count: number;
    };
}
interface BreadcrumbItem {
    id?: number | null;
    label?: MessageDescriptor | string;
    path?: string;
}
type BreadcrumbData = BreadcrumbItem | [];
export declare const getBreadcrumbDataCM: (folder: BreadcrumbDataFolder | null) => BreadcrumbData[];
export {};
