import { UpdateFile } from '../../../../shared/contracts/files';
export interface UploadProgressProps {
    error?: UpdateFile.Response['error'] | Error | null;
    onCancel: () => void;
    progress?: number;
}
export declare const UploadProgress: ({ onCancel, progress, error }: UploadProgressProps) => import("react/jsx-runtime").JSX.Element;
