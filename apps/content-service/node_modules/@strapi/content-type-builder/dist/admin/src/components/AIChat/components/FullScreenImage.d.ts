import { ReactNode } from 'react';
interface FullScreenImageProps {
    src: string;
    alt: string;
    onClose?: () => void;
}
interface FullScreenImageRootProps extends FullScreenImageProps {
    children: ReactNode;
    defaultOpen?: boolean;
}
interface FullScreenImageTriggerProps {
    children: ReactNode;
    asChild?: boolean;
}
export declare const setOpacity: (hex: string, alpha: number) => string;
export declare const FullScreenImage: {
    Root: ({ children, src, alt, onClose, defaultOpen }: FullScreenImageRootProps) => import("react/jsx-runtime").JSX.Element;
    Trigger: ({ children, asChild }: FullScreenImageTriggerProps) => import("react/jsx-runtime").JSX.Element;
};
export {};
