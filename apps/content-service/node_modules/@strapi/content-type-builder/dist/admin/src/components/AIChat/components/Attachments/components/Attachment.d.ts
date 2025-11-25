import { ReactNode } from 'react';
interface AttachmentContextValue {
    error?: string | null;
}
declare const useAttachmentContext: () => AttachmentContextValue;
export interface AttachmentRootProps {
    children: ReactNode;
    error?: string | null;
    minWidth?: string;
    maxWidth?: string;
}
interface AttachmentPreviewProps {
    children: ReactNode;
}
interface AttachmentTitleProps {
    children: ReactNode;
}
interface AttachmentRemoveProps {
    onClick: () => void;
}
export declare const Attachment: {
    Root: ({ children, error, minWidth, maxWidth }: AttachmentRootProps) => import("react/jsx-runtime").JSX.Element;
    Preview: ({ children }: AttachmentPreviewProps) => import("react/jsx-runtime").JSX.Element;
    Title: ({ children }: AttachmentTitleProps) => import("react/jsx-runtime").JSX.Element;
    Remove: ({ onClick }: AttachmentRemoveProps) => import("react/jsx-runtime").JSX.Element;
};
export { useAttachmentContext };
