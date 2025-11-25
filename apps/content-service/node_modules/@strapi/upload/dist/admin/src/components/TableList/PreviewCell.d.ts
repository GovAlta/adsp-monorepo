import type { File } from '../../../../shared/contracts/files';
interface PreviewCellProps {
    content: File;
    type?: string;
}
export declare const PreviewCell: ({ type, content }: PreviewCellProps) => import("react/jsx-runtime").JSX.Element;
export {};
