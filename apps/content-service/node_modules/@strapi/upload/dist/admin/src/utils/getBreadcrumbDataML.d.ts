import type { Query } from '../../../shared/contracts/files';
import type { Folder } from '../../../shared/contracts/folders';
import type { MessageDescriptor } from 'react-intl';
interface GetBreadcrumbDataMLProps {
    folder: Folder;
    options: {
        pathname: string;
        query?: Query;
    };
}
interface GetBreadcrumbDataMLReturn {
    id: number | null;
    label: string | MessageDescriptor;
    href?: string;
}
type BreadcrumbData = GetBreadcrumbDataMLReturn | [];
export declare const getBreadcrumbDataML: (folder: GetBreadcrumbDataMLProps['folder'] | null, { pathname, query }: GetBreadcrumbDataMLProps['options']) => BreadcrumbData[];
export {};
