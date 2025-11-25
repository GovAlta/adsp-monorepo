import * as React from 'react';
interface EditorLayoutProps {
    children: React.ReactNode;
    error?: string;
    onToggleExpand: () => void;
    disabled: boolean;
    ariaDescriptionId: string;
}
declare const EditorLayout: ({ children, error, disabled, onToggleExpand, ariaDescriptionId, }: EditorLayoutProps) => import("react/jsx-runtime").JSX.Element;
export { EditorLayout };
