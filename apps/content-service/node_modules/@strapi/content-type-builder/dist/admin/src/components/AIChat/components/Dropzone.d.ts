/// <reference types="react" />
import { Flex } from '@strapi/design-system';
interface UseClipboardPasteProps {
    onAddFiles: (files: File[]) => void;
    isEnabled?: boolean;
    accept?: {
        [key: string]: string[];
    };
}
export declare const useClipboardPasteImages: ({ onAddFiles, isEnabled, }: UseClipboardPasteProps) => void;
export interface DropzoneContextValue {
    isEnabled?: boolean;
    isDragActive?: boolean;
    onAddFiles?: (files: File[]) => void;
}
export declare const useDropzoneContext: () => DropzoneContextValue;
export interface DropzoneRootProps extends React.ComponentPropsWithoutRef<typeof Flex> {
    children: React.ReactNode;
    isEnabled?: boolean;
    onAddFiles?: (files: File[]) => void;
    accept?: {
        [key: string]: string[];
    };
}
export declare const Root: ({ children, isEnabled, onAddFiles, accept, ...props }: DropzoneRootProps) => import("react/jsx-runtime").JSX.Element;
interface DropzoneAreaProps extends React.ComponentPropsWithoutRef<typeof Flex> {
    error?: string | null;
    title?: string;
}
export declare const Dropzone: {
    Root: ({ children, isEnabled, onAddFiles, accept, ...props }: DropzoneRootProps) => import("react/jsx-runtime").JSX.Element;
    Area: ({ error, title, ...props }: DropzoneAreaProps) => import("react/jsx-runtime").JSX.Element | null;
    useDropzoneContext: () => DropzoneContextValue;
};
export {};
