import type { File } from '../../../../shared/contracts/files';
export interface CellContentProps {
    cellType: string;
    contentType?: string;
    content: File;
    name: string;
}
export declare const CellContent: ({ cellType, contentType, content, name }: CellContentProps) => import("react/jsx-runtime").JSX.Element;
