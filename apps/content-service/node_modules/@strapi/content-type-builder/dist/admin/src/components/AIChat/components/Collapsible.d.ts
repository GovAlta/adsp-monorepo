interface CollapsibleContextValue {
    open: boolean;
    toggle: () => void;
}
export declare const useCollapsible: () => CollapsibleContextValue;
export declare const Collapsible: ({ children, defaultOpen, }: {
    children: React.ReactNode;
    defaultOpen?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export declare const CollapsibleTrigger: ({ children, }: {
    children: React.ReactNode | ((props: {
        open: boolean;
    }) => React.ReactNode);
}) => import("react/jsx-runtime").JSX.Element;
export declare const CollapsibleContent: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export {};
