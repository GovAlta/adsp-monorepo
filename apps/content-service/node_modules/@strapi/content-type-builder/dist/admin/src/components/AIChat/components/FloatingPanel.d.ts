/// <reference types="react" />
type PanelSize = 'sm' | 'md' | 'lg';
type PanelPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
interface PanelContextValue {
    size: PanelSize;
    position: PanelPosition;
    isOpen: boolean;
    onToggle: () => void;
}
interface RootProps {
    children: React.ReactNode;
    size?: PanelSize;
    position?: PanelPosition;
    isOpen?: boolean;
    onToggle?: () => void;
    toggleIcon?: React.ReactNode;
}
export declare const Panel: {
    Root: ({ children, size, position, isOpen, onToggle, toggleIcon, }: RootProps) => import("react/jsx-runtime").JSX.Element;
    Header: ({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    Body: ({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    Footer: ({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    Close: ({ label }: {
        label?: string;
    }) => import("react/jsx-runtime").JSX.Element;
};
export declare const usePanel: () => PanelContextValue;
export {};
